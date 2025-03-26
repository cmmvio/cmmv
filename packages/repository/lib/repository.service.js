"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositorySchema = exports.Repository = void 0;
const tslib_1 = require("tslib");
const path = require("node:path");
const node_process_1 = require("node:process");
const fg = require("fast-glob");
const typeorm_1 = require("typeorm");
const core_1 = require("@cmmv/core");
const mongodb_1 = require("mongodb");
class Repository extends core_1.Singleton {
    /**
     * Load the repository configuration and initialize the database connection
     * @returns Promise<void>
     */
    static async loadConfig() {
        const instance = Repository.getInstance();
        const config = core_1.Config.get('repository');
        const sourceDir = core_1.Config.get('app.sourceDir', 'src');
        const migrations = core_1.Config.get('repository.migrations', true);
        const migrationsDir = core_1.Config.get('repository.migrationsDir', path.join((0, node_process_1.cwd)(), 'src', 'migrations'));
        const entitiesDir = path.join((0, node_process_1.cwd)(), sourceDir, 'entities');
        const entitiesGeneratedDir = path.join((0, node_process_1.cwd)(), '.generated', 'entities');
        const migrationsGeneratedDir = path.join((0, node_process_1.cwd)(), '.generated', 'migrations');
        try {
            const AppDataSource = new typeorm_1.DataSource({
                ...config,
                entities: [
                    `${entitiesDir}/**/*.entity.ts`,
                    `${entitiesGeneratedDir}/**/*.entity.ts`,
                ],
                migrations: migrations
                    ? [
                        `${migrationsDir}/**/*.ts`,
                        `${migrationsGeneratedDir}/**/*.ts`,
                    ]
                    : [],
            });
            instance.dataSource = await AppDataSource.initialize();
        }
        catch (error) {
            this.logger.error('Database connection error:', error);
            const AppDataSource = new typeorm_1.DataSource({
                ...config,
                entities: [
                    `${entitiesDir}/**/*.entity.ts`,
                    `${entitiesGeneratedDir}/**/*.entity.ts`,
                ],
                migrations: migrations
                    ? [
                        `${migrationsDir}/**/*.ts`,
                        `${migrationsGeneratedDir}/**/*.ts`,
                    ]
                    : [],
                synchronize: false,
            });
            instance.dataSource = await AppDataSource.initialize();
        }
        if (instance.dataSource) {
            instance.dataSource.entityMetadatas?.forEach((entity) => {
                Repository.entities.set(entity.name, entity.target);
                if (entity.name === 'LogsEntity')
                    Repository.logEntity = entity.target;
            });
        }
    }
    static async log(message) {
        if (Repository.logEntity !== null) {
            const repository = this.getRepository(Repository.logEntity);
            switch (message.context) {
                case 'HTTP':
                    const split = message.message.split(' ');
                    const method = split[0];
                    const url = split[1];
                    const processTime = split[2]
                        .replace('(', '')
                        .replace(')', '');
                    const status = split[3];
                    const ip = split[4];
                    let messageLog = '';
                    switch (status) {
                        case '200':
                            messageLog = `connection authorized: method="${method}" url="${url}" ip="${ip}" process_time="${processTime}" status="${status}"`;
                            break;
                        case '401':
                            messageLog = `connection unauthorized: method="${method}" url="${url}" ip="${ip}" process_time="${processTime}" status="${status}"`;
                            break;
                        case '403':
                            messageLog = `connection forbidden: method="${method}" url="${url}" ip="${ip}" process_time="${processTime}" status="${status}"`;
                            break;
                        case '404':
                            messageLog = `connection not found: method="${method}" url="${url}" ip="${ip}" process_time="${processTime}" status="${status}"`;
                            break;
                        case '500':
                            messageLog = `connection error: method="${method}" url="${url}" ip="${ip}" process_time="${processTime}" status="${status}"`;
                            break;
                    }
                    const newEntity = repository.create({
                        message: messageLog,
                        timestamp: message.timestamp,
                        source: message.context,
                        level: message.level,
                        event: JSON.stringify({
                            process_id: process.pid,
                            method: method,
                            url: url,
                            process_time: processTime,
                            status: status,
                            connection_from: ip,
                        }),
                    });
                    await repository.save(newEntity);
                    break;
                case 'DATABASE':
                    const config = core_1.Config.get('repository');
                    const newEntityDatabase = repository.create({
                        message: `query: database="${config.database}" entity="${message.metadata?.entity}" total="${message.metadata?.total}"`,
                        timestamp: message.timestamp,
                        source: message.context,
                        level: message.level,
                        event: JSON.stringify({
                            process_id: process.pid,
                            process_time: message.metadata?.process_time,
                        }),
                        metadata: JSON.stringify(message.metadata ?? {}),
                    });
                    await repository.save(newEntityDatabase);
                    break;
                case 'AUTH':
                    const newEntityAuth = repository.create({
                        message: message.message,
                        timestamp: message.timestamp,
                        source: message.context,
                        level: message.level,
                        event: JSON.stringify(message.event ?? {}),
                        metadata: JSON.stringify(message.metadata ?? {}),
                    });
                    await repository.save(newEntityAuth);
                    break;
                case 'EVENT':
                    const newEntityDefault = repository.create({
                        message: message.message,
                        timestamp: message.timestamp,
                        source: message.context,
                        level: message.level,
                        metadata: JSON.stringify(message.metadata ?? {}),
                    });
                    await repository.save(newEntityDefault);
                    break;
            }
        }
    }
    /**
     * Get the data source instance
     * @returns DataSource
     */
    static getDataSource() {
        core_1.Config.loadConfig();
        const config = core_1.Config.get('repository');
        const sourceDir = core_1.Config.get('app.sourceDir', 'src');
        const entitiesDir = path.join((0, node_process_1.cwd)(), sourceDir, 'entities');
        const entitiesGeneratedDir = path.join((0, node_process_1.cwd)(), '.generated', 'entities');
        const migrationsDir = path.join((0, node_process_1.cwd)(), sourceDir, 'migrations');
        const migrationsGeneratedDir = path.join((0, node_process_1.cwd)(), '.generated', 'migrations');
        const entityFiles = fg.sync([
            `${entitiesDir}/**/*.entity.ts`,
            `${entitiesGeneratedDir}/**/*.entity.ts`,
        ]);
        const migrationFiles = fg.sync([
            `${migrationsDir}/**/*.ts`,
            `${migrationsGeneratedDir}/**/*.ts`,
        ]);
        const AppDataSource = new typeorm_1.DataSource({
            ...config,
            entities: entityFiles,
            migrations: migrationFiles,
            synchronize: false,
        });
        return AppDataSource;
    }
    /**
     * Generate a MongoDB connection URL
     * @returns string
     */
    static generateMongoUrl() {
        const config = core_1.Config.get('repository');
        const protocol = 'mongodb';
        const username = config.username
            ? encodeURIComponent(config.username)
            : '';
        const password = config.password
            ? encodeURIComponent(config.password)
            : '';
        const authSource = config.authSource
            ? `?authSource=${config.authSource}`
            : '';
        const replicaSet = config.replicaSet
            ? `&replicaSet=${config.replicaSet}`
            : '';
        const host = Array.isArray(config.host)
            ? config.host.join(',')
            : config.host;
        const port = config.port ? `:${config.port}` : '';
        const database = config.database ? `/${config.database}` : '';
        if (username && password)
            return `${protocol}://${username}:${password}@${host}${port}${database}${authSource}${replicaSet}`;
        return `${protocol}://${host}${port}${database}${authSource}${replicaSet}`;
    }
    /**
     * Get a repository instance for a given entity
     * @param entity - The entity type
     * @returns TypeORMRepository<Entity>
     */
    static getRepository(entity) {
        const instance = Repository.getInstance();
        return instance.dataSource.getRepository(entity);
    }
    /**
     * Get the ID field for the repository
     * @returns string
     */
    static getIdField() {
        return core_1.Config.get('repository.type') === 'mongodb' ? '_id' : 'id';
    }
    /**
     * Fix the ID for the repository
     * @param id - The ID to fix
     * @returns ObjectId | string
     */
    static fixId(id) {
        if (typeof id === 'string')
            return core_1.Config.get('repository.type') === 'mongodb'
                ? new mongodb_1.ObjectId(id)
                : id;
        else
            return core_1.Config.get('repository.type') === 'mongodb'
                ? id
                : id.toString();
    }
    /**
     * Fix the ID for the repository
     * @param value - The value to fix
     * @returns ObjectId | string
     */
    static fixObjectIds(value) {
        const isMongoDB = core_1.Config.get('repository.type') === 'mongodb';
        if (typeof value === 'string') {
            value = this.fixId(value);
        }
        else if (typeof value === 'object' && value !== null) {
            if (value.$in && Array.isArray(value.$in)) {
                value = isMongoDB
                    ? { $in: value.$in.map((id) => this.fixId(id)) }
                    : (0, typeorm_1.In)(value.$in.map((id) => this.fixId(id)));
            }
            else {
                value = value;
            }
        }
        return value;
    }
    /**
     * Escape a string for the repository
     * @param str - The string to escape
     * @returns string
     */
    static escape(str) {
        if (typeof str !== 'string')
            return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\\/g, '\\\\')
            .replace(/\$/g, '\\$')
            .replace(/\//g, '\\/');
    }
    /**
     * Get an entity for the repository
     * @param name - The name of the entity
     * @returns new () => any | null
     */
    static getEntity(name) {
        if (Repository.entities.has(name))
            return Repository.entities.get(name);
        throw new Error(`Could not load entity '${name}'`);
    }
    /**
     * Query builder for the repository
     * @param payload - The payload to query
     * @returns FindOptionsWhere<Entity>
     */
    static queryBuilder(payload) {
        let query = {};
        for (let key in payload) {
            if ((key === 'id' || key === '_id') &&
                typeof payload[key] === 'string')
                query[this.getIdField()] = this.fixId(payload[key]);
            else if ((key === 'id' || key === '_id') &&
                typeof payload[key] === 'object')
                query[this.getIdField()] = this.fixObjectIds(payload[key]);
            else
                query[key] = payload[key];
        }
        return query;
    }
    /**
     * Find a single entity by criteria
     * @param entity - The entity type
     * @param criteria - The criteria to find the entity by
     * @param options - The options to find the entity by
     * @returns Entity | null
     */
    static async findBy(entity, criteria, options = {}) {
        try {
            const repository = this.getRepository(entity);
            const registry = await repository.findOne({
                where: criteria,
                ...options,
            });
            return registry ? registry : null;
        }
        catch (e) {
            if (process.env.NODE_ENV === 'dev')
                Repository.logger.error(e.message);
            return null;
        }
    }
    /**
     * Find all entities by criteria
     * @param entity - The entity type
     * @param queries - The queries to find the entities by
     * @param relations - The relations to find the entities by
     * @param options - The options to find the entities by
     * @returns IFindResponse | null
     */
    static async findAll(entity, queries, relations, options) {
        try {
            const isMongoDB = core_1.Config.get('repository.type') === 'mongodb';
            const repository = this.getRepository(entity);
            const limit = Math.max(1, Math.min(100, parseInt(queries?.limit) || 10));
            const offset = Math.max(0, parseInt(queries?.offset) || 0);
            const sortBy = this.escape(queries?.sortBy || 'id');
            const sort = queries?.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            const search = this.escape(queries?.search || '');
            const searchField = escape(queries?.searchField || '');
            const filters = queries ? { ...queries } : {};
            delete filters.limit;
            delete filters.offset;
            delete filters.sortBy;
            delete filters.sort;
            delete filters.search;
            delete filters.searchField;
            const where = {};
            if (search && searchField) {
                if (isMongoDB)
                    where[searchField] = { $regex: new RegExp(search, 'i') };
                else
                    where[searchField] = (0, typeorm_1.Like)(`%${search}%`);
            }
            Object.entries(filters).forEach(([key, value]) => {
                where[key] = this.escape(value);
            });
            if (!options)
                options = {};
            const order = {
                [sortBy]: sort,
            };
            const queryOptions = {
                where,
                relations,
                take: limit,
                skip: offset,
                order,
                ...options,
            };
            const start = Date.now();
            const total = await repository.count(queryOptions.where);
            const results = await repository.find(queryOptions);
            const end = Date.now();
            if (entity.name !== 'LogsEntity') {
                core_1.Hooks.execute(core_1.HooksType.Log, {
                    context: 'DATABASE',
                    message: `findAll: ${entity.name} (${end - start}ms)`,
                    level: 'INFO',
                    timestamp: Date.now(),
                    metadata: {
                        total,
                        entity: entity.name,
                        process_time: end - start,
                        ...queryOptions,
                    },
                });
            }
            return {
                data: results,
                count: total,
                pagination: {
                    limit,
                    offset,
                    sortBy,
                    sort,
                    search,
                    searchField,
                    filters,
                },
            };
        }
        catch (error) {
            console.error('Database findAll error:', error);
            return null;
        }
    }
    /**
     * Insert an entity into the repository
     * @param entity - The entity type
     * @param data - The data to insert
     * @returns IInsertResponse
     */
    static async insert(entity, data) {
        try {
            const repository = this.getRepository(entity);
            const newEntity = repository.create(data);
            return { data: await repository.save(newEntity), success: true };
        }
        catch (e) {
            return { success: false, message: e.message };
        }
    }
    /**
     * Insert an entity into the repository if it does not exist
     * @param entity - The entity type
     * @param data - The data to insert
     * @param fieldFilter - The field to filter by
     * @returns boolean
     */
    static async insertIfNotExists(entity, data, fieldFilter) {
        try {
            let criteria = {};
            criteria[fieldFilter] = data[fieldFilter];
            const repository = this.getRepository(entity);
            const exists = await repository.findOne({ where: criteria });
            if (!exists) {
                const newEntity = repository.create(data);
                await repository.save(newEntity);
            }
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Update an entity in the repository
     * @param entity - The entity type
     * @param id - The ID of the entity
     * @param data - The data to update
     * @returns number
     */
    static async update(entity, id, data) {
        try {
            const repository = this.getRepository(entity);
            const result = await repository.update(id, data);
            return result.affected;
        }
        catch (e) {
            console.log(e);
            return 0;
        }
    }
    /**
     * Update an entity in the repository by criteria
     * @param entity - The entity type
     * @param criteria - The criteria to update the entity by
     * @param data - The data to update
     * @returns boolean
     */
    static async updateOne(entity, criteria, data) {
        try {
            const repository = this.getRepository(entity);
            const existingRecord = await repository.findOne({
                where: criteria,
            });
            if (!existingRecord)
                return false;
            Object.assign(existingRecord, data);
            await repository.save(existingRecord);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Update an entity in the repository by ID
     * @param entity - The entity type
     * @param id - The ID of the entity
     * @param data - The data to update
     * @returns boolean
     */
    static async updateById(entity, id, data) {
        try {
            const repository = this.getRepository(entity);
            const query = {
                [this.getIdField()]: this.fixId(id),
            };
            const existingRecord = await repository.findOne({
                where: query,
                select: {
                    [this.getIdField()]: true,
                },
            });
            if (!existingRecord)
                return false;
            Object.assign(existingRecord, data);
            await repository.save(existingRecord);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Delete an entity from the repository
     * @param entity - The entity type
     * @param id - The ID of the entity
     * @returns number
     */
    static async delete(entity, id) {
        try {
            const repository = this.getRepository(entity);
            const result = await repository.delete(id);
            return result.affected;
        }
        catch (e) {
            return 0;
        }
    }
    /**
     * Check if an entity exists in the repository
     * @param entity - The entity type
     * @param criteria - The criteria to check if the entity exists by
     * @returns boolean
     */
    static async exists(entity, criteria) {
        try {
            const repository = this.getRepository(entity);
            const result = await repository.findOne({
                where: criteria,
                select: {
                    [this.getIdField()]: true,
                },
            });
            return result !== null;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * List all databases
     * @returns { databases: string[] }
     */
    static async listDatabases() {
        const instance = this.getInstance();
        const type = core_1.Config.get('repository.type');
        if (type === 'mongodb') {
            const client = new mongodb_1.MongoClient(Repository.generateMongoUrl());
            const conn = await client.connect();
            const result = await conn.db().admin().listDatabases();
            return { databases: result.databases.map((db) => db.name) };
        }
        if (type === 'sqlite') {
            throw new Error(`SQLite does not support database listing`);
        }
        else {
            const queryRunner = instance.dataSource.createQueryRunner();
            const databases = await queryRunner.query('SHOW DATABASES');
            await queryRunner.release();
            return {
                databases: databases.map((db) => Object.values(db)[0]),
            };
        }
    }
    /**
     * List all tables in a database
     * @param database - The database to list the tables from
     * @returns { tables: string[] }
     */
    static async listTables(database) {
        const instance = this.getInstance();
        const type = core_1.Config.get('repository.type');
        if (type === 'mongodb') {
            const client = new mongodb_1.MongoClient(Repository.generateMongoUrl());
            const conn = await client.connect();
            const result = await conn
                .db(database)
                .listCollections()
                .toArray();
            return { tables: result.map((collection) => collection.name) };
        }
        else {
            const queryRunner = instance.dataSource.createQueryRunner();
            let query = '';
            switch (type) {
                case 'mysql':
                    query = `SHOW TABLES FROM \`${database}\``;
                    break;
                case 'postgres':
                    query = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_catalog = '${database}'`;
                    break;
                case 'mssql':
                    query = `SELECT name FROM ${database}.sys.tables`;
                    break;
                case 'sqlite':
                    query = `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`;
                    break;
                default:
                    throw new Error(`Database type '${type}' is not supported for table listing.`);
            }
            const result = await queryRunner.query(query);
            await queryRunner.release();
            return { tables: result.map((row) => Object.values(row)[0]) };
        }
    }
    /**
     * List all indexes for a table
     * @param table - The table to list the indexes from
     * @returns any[]
     */
    static async listIndexes(table) {
        try {
            const queryRunner = this.getInstance().dataSource.createQueryRunner();
            const indexes = await queryRunner.getTable(table);
            await queryRunner.release();
            return indexes ? indexes.indices : [];
        }
        catch (error) {
            Repository.logger.error(`Error listing indexes for ${table}: ${error.message}`);
            return [];
        }
    }
    /**
     * Create a table in the repository
     * @param tableName - The name of the table to create
     * @param columns - The columns to create in the table
     * @returns boolean
     */
    static async createTable(tableName, columns) {
        try {
            const queryRunner = this.getInstance().dataSource.createQueryRunner();
            await queryRunner.createTable(new typeorm_1.Table({
                name: tableName,
                columns: columns,
            }));
            await queryRunner.release();
            return true;
        }
        catch (error) {
            Repository.logger.error(`Error creating table ${tableName}: ${error.message}`);
            return false;
        }
    }
    /**
     * Update an index in the repository
     * @param table - The table to update the index on
     * @param indexName - The name of the index to update
     * @param newIndexDefinition - The new index definition
     * @returns boolean
     */
    static async updateIndex(table, indexName, newIndexDefinition) {
        try {
            const queryRunner = this.getInstance().dataSource.createQueryRunner();
            const tableSchema = await queryRunner.getTable(table);
            if (!tableSchema)
                return false;
            const existingIndex = tableSchema.indices.find((index) => index.name === indexName);
            if (existingIndex)
                await queryRunner.dropIndex(table, indexName);
            await queryRunner.createIndex(table, new typeorm_1.TableIndex(newIndexDefinition));
            await queryRunner.release();
            return true;
        }
        catch (error) {
            Repository.logger.error(`Error updating index ${indexName} on table ${table}: ${error.message}`);
            return false;
        }
    }
    /**
     * Remove an index from a table
     * @param table - The table to remove the index from
     * @param indexName - The name of the index to remove
     * @returns boolean
     */
    static async removeIndex(table, indexName) {
        try {
            const queryRunner = this.getInstance().dataSource.createQueryRunner();
            await queryRunner.dropIndex(table, indexName);
            await queryRunner.release();
            return true;
        }
        catch (error) {
            Repository.logger.error(`Error removing index ${indexName} from table ${table}: ${error.message}`);
            return false;
        }
    }
    /**
     * List all fields for a table
     * @param table - The table to list the fields from
     * @returns any[]
     */
    static async listFields(table) {
        try {
            const queryRunner = this.getInstance().dataSource.createQueryRunner();
            const tableSchema = await queryRunner.getTable(table);
            await queryRunner.release();
            return tableSchema ? tableSchema.columns : [];
        }
        catch (error) {
            Repository.logger.error(`Error listing fields for ${table}: ${error.message}`);
            return [];
        }
    }
}
exports.Repository = Repository;
Repository.logger = new core_1.Logger('Repository');
Repository.entities = new Map();
Repository.logEntity = null;
tslib_1.__decorate([
    (0, core_1.Hook)(core_1.HooksType.Log),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], Repository, "log", null);
class RepositorySchema {
    /**
     * Constructor for the RepositorySchema class
     * @param entity - The entity type
     * @param model - The model type
     * @param fakeDelete - Whether to fake delete entities
     * @param timestamps - Whether to include timestamps in entities
     * @param userAction - Whether to include user action in entities
     */
    constructor(entity, model, fakeDelete = false, timestamps = false, userAction = false) {
        this.entity = entity;
        this.model = model;
        this.fakeDelete = fakeDelete;
        this.timestamps = timestamps;
        this.userAction = userAction;
    }
    /**
     * Get all entities
     * @param queries - The queries to get the entities by
     * @param req - The request object
     * @param options - The options to get the entities by
     * @returns IFindResponse
     */
    async getAll(queries, req, options) {
        if (this.fakeDelete)
            queries.deleted = false;
        let result = await Repository.findAll(this.entity, queries);
        if (core_1.Config.get('repository.type') === 'mongodb')
            result = this.fixIds(result);
        if (!result)
            throw new Error('Unable to return a valid result.');
        let resultModels = result && result.data.length > 0
            ? result.data //@ts-ignore
                .map((item) => this.model.fromEntity(item))
            : [];
        if (options && options.resolvers) {
            const resolvers = Array.isArray(options.resolvers)
                ? options.resolvers
                : [options.resolvers];
            for (let keyResolver in resolvers) {
                if (core_1.Resolvers.has(resolvers[keyResolver])) {
                    for (let key in resultModels) {
                        resultModels[key] = await core_1.Resolvers.execute(resolvers[keyResolver], resultModels[key]);
                    }
                }
            }
        }
        return {
            count: result.count,
            pagination: result.pagination,
            data: resultModels,
        };
    }
    /**
     * Get entities by in array
     * @param inArr - The in array
     * @param options - The options to get the entities by
     * @returns IFindResponse
     */
    async getIn(inArr, options) {
        const inToAssign = Array.isArray(inArr) ? inArr : [inArr];
        let query = {};
        if (this.fakeDelete) {
            query = Repository.queryBuilder({
                id: { $in: inToAssign },
                deleted: false,
            });
        }
        else {
            query = Repository.queryBuilder({
                id: { $in: inToAssign },
            });
        }
        const result = await Repository.findAll(this.entity, query);
        let resultModels = result && result.data.length > 0
            ? result.data //@ts-ignore
                .map((item) => this.model.fromEntity(item))
            : [];
        if (options && options.resolvers) {
            const resolvers = Array.isArray(options.resolvers)
                ? options.resolvers
                : [options.resolvers];
            for (let keyResolver in resolvers) {
                if (core_1.Resolvers.has(resolvers[keyResolver])) {
                    for (let key in resultModels) {
                        resultModels[key] = await core_1.Resolvers.execute(resolvers[keyResolver], resultModels[key]);
                    }
                }
            }
        }
        return {
            count: result.count,
            pagination: result.pagination,
            data: resultModels,
        };
    }
    /**
     * Get an entity by ID
     * @param id - The ID of the entity
     * @param options - The options to get the entity by
     * @returns IFindResponse
     */
    async getById(id, options) {
        let query = {};
        if (this.fakeDelete)
            query = Repository.queryBuilder({ id, deleted: false });
        else
            query = Repository.queryBuilder({ id });
        let result = await Repository.findBy(this.entity, query);
        if (core_1.Config.get('repository.type') === 'mongodb')
            result = this.fixIds(result);
        if (!result)
            throw new Error('Unable to return a valid result.');
        //@ts-ignore
        let resultModel = this.model.fromEntity(result);
        if (options && options.resolvers) {
            const resolvers = Array.isArray(options.resolvers)
                ? options.resolvers
                : [options.resolvers];
            for (let keyResolver in resolvers) {
                if (core_1.Resolvers.has(resolvers[keyResolver])) {
                    resultModel = await core_1.Resolvers.execute(resolvers[keyResolver], resultModel);
                }
            }
        }
        return {
            count: 1,
            pagination: {
                limit: 1,
                offset: 0,
                search: id,
                searchField: 'id',
                sortBy: 'id',
                sort: 'asc',
                filters: {},
            },
            data: resultModel,
        };
    }
    /**
     * Insert an entity into the repository
     * @param data - The data to insert
     * @returns any
     */
    async insert(data) {
        const result = await Repository.insert(this.entity, data);
        if (!result.success)
            throw new Error(result.message || 'Insert operation failed');
        return { data: this.toModel(this.model, result.data) };
    }
    /**
     * Update an entity in the repository
     * @param id - The ID of the entity
     * @param data - The data to update
     * @returns number
     */
    async update(id, data) {
        if (data.deleted)
            delete data.deleted;
        let result = 0;
        let dataToUpdate = this.timestamps
            ? {
                ...data,
                updatedAt: new Date(),
            }
            : data;
        if (this.fakeDelete) {
            result = await Repository.update(this.entity, Repository.queryBuilder({ id, deleted: false }), dataToUpdate);
        }
        else {
            result = await Repository.update(this.entity, Repository.queryBuilder({ id }), dataToUpdate);
        }
        return { success: result > 0, affected: result };
    }
    /**
     * Delete an entity from the repository
     * @param id - The ID of the entity
     * @returns { success: boolean, affected: number }
     */
    async delete(id) {
        let result = 0;
        if (this.fakeDelete) {
            result = await Repository.update(this.entity, Repository.queryBuilder({ id }), {
                deleted: true,
                deletedAt: new Date(),
            });
        }
        else {
            result = await Repository.delete(this.entity, Repository.queryBuilder({ id }));
        }
        return { success: result > 0, affected: result };
    }
    /**
     * Fix the IDs for the repository
     * @param item - The item to fix the IDs for
     * @param subtree - Whether to fix the IDs for a subtree
     * @returns any
     */
    fixIds(item, subtree = false) {
        if (item && typeof item === 'object') {
            if (item._id) {
                item.id = item._id.toString();
                delete item._id;
            }
            for (const key in item) {
                if (Array.isArray(item[key])) {
                    item[key] = item[key].map((element) => this.fixIds(element));
                }
                else if (item[key] instanceof mongodb_1.ObjectId) {
                    item[key] = item[key].toString();
                }
                else if (typeof item[key] === 'object' && !subtree) {
                    item[key] = this.fixIds(item[key], true);
                }
            }
        }
        return item;
    }
    /**
     * Convert a partial model to a full model
     * @param model - The model to convert
     * @param data - The data to convert
     * @param req - The request object
     * @returns any
     */
    fromPartial(model, data, req) {
        if (model && model.fromPartial)
            return this.extraData(model?.fromPartial(data), req);
        else
            return data;
    }
    /**
     * Convert a data object to a model
     * @param model - The model to convert
     * @param data - The data to convert
     * @returns any
     */
    toModel(model, data) {
        const dataFixed = core_1.Config.get('repository.type') === 'mongodb'
            ? this.fixIds(data)
            : data;
        return model && model.fromEntity
            ? model.fromEntity(dataFixed)
            : dataFixed;
    }
    /**
     * Extra data from the request
     * @param newItem - The new item
     * @param req - The request object
     * @returns any
     */
    extraData(newItem, req) {
        const userId = req?.user?.id;
        if (typeof userId === 'string') {
            try {
                newItem.userCreator =
                    core_1.Config.get('repository.type') === 'mongodb'
                        ? new mongodb_1.ObjectId(userId)
                        : userId;
            }
            catch (error) {
                console.warn('Error assigning userCreator:', error);
            }
        }
        return newItem;
    }
}
exports.RepositorySchema = RepositorySchema;
