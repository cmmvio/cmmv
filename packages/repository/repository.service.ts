import * as path from 'node:path';
import { cwd } from 'node:process';
import * as fg from 'fast-glob';

import {
    DataSource,
    Repository as TypeORMRepository,
    FindOptionsWhere,
    DeepPartial,
    Like,
    FindManyOptions,
    FindOptionsSelect,
    FindOptionsOrder,
    FindOneOptions,
    Table,
    TableIndex,
    In,
} from 'typeorm';

import { Config, Logger, Singleton, Resolvers } from '@cmmv/core';

import { ObjectId, MongoClient } from 'mongodb';

import {
    IFindResponse,
    IInsertResponse,
    IFindOptions,
} from './repository.interface';

export class Repository extends Singleton {
    public static logger: Logger = new Logger('Repository');
    public static entities = new Map<string, any>();
    public dataSource: DataSource;

    /**
     * Load the repository configuration and initialize the database connection
     * @returns Promise<void>
     */
    public static async loadConfig(): Promise<void> {
        const instance = Repository.getInstance();
        const config = Config.get('repository');

        const sourceDir = Config.get<string>('app.sourceDir', 'src');
        const migrations = Config.get<boolean>('repository.migrations', true);
        const migrationsDir = Config.get<string>(
            'repository.migrationsDir',
            path.join(cwd(), 'src', 'migrations'),
        );

        const entitiesDir = path.join(cwd(), sourceDir, 'entities');
        const entitiesGeneratedDir = path.join(cwd(), '.generated', 'entities');
        const migrationsGeneratedDir = path.join(
            cwd(),
            '.generated',
            'migrations',
        );

        try {
            const AppDataSource = new DataSource({
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
        } catch (error) {
            this.logger.error('Database connection error:', error);

            const AppDataSource = new DataSource({
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
            });
        }
    }

    /**
     * Get the data source instance
     * @returns DataSource
     */
    public static getDataSource() {
        Config.loadConfig();
        const config = Config.get('repository');

        const sourceDir = Config.get<string>('app.sourceDir', 'src');
        const entitiesDir = path.join(cwd(), sourceDir, 'entities');
        const entitiesGeneratedDir = path.join(cwd(), '.generated', 'entities');
        const migrationsDir = path.join(cwd(), sourceDir, 'migrations');
        const migrationsGeneratedDir = path.join(
            cwd(),
            '.generated',
            'migrations',
        );
        const entityFiles = fg.sync([
            `${entitiesDir}/**/*.entity.ts`,
            `${entitiesGeneratedDir}/**/*.entity.ts`,
        ]);
        const migrationFiles = fg.sync([
            `${migrationsDir}/**/*.ts`,
            `${migrationsGeneratedDir}/**/*.ts`,
        ]);

        const AppDataSource = new DataSource({
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
    public static generateMongoUrl(): string {
        const config = Config.get('repository');

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
    private static getRepository<Entity>(
        entity: new () => Entity,
    ): TypeORMRepository<Entity> {
        const instance = Repository.getInstance();
        return instance.dataSource.getRepository(entity);
    }

    /**
     * Get the ID field for the repository
     * @returns string
     */
    private static getIdField(): string {
        return Config.get('repository.type') === 'mongodb' ? '_id' : 'id';
    }

    /**
     * Fix the ID for the repository
     * @param id - The ID to fix
     * @returns ObjectId | string
     */
    private static fixId(id: string | ObjectId): ObjectId | string {
        if (typeof id === 'string')
            return Config.get('repository.type') === 'mongodb'
                ? new ObjectId(id)
                : id;
        else
            return Config.get('repository.type') === 'mongodb'
                ? id
                : id.toString();
    }

    /**
     * Fix the ID for the repository
     * @param value - The value to fix
     * @returns ObjectId | string
     */
    public static fixObjectIds(value: any): any {
        const isMongoDB = Config.get('repository.type') === 'mongodb';

        if (typeof value === 'string') {
            value = this.fixId(value);
        } else if (typeof value === 'object' && value !== null) {
            if (value.$in && Array.isArray(value.$in)) {
                value = isMongoDB
                    ? { $in: value.$in.map((id) => this.fixId(id)) }
                    : In(value.$in.map((id) => this.fixId(id)));
            } else {
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
    private static escape(str: any): string {
        if (typeof str !== 'string') return str;

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
    public static getEntity(name: string): new () => any | null {
        if (Repository.entities.has(name)) return Repository.entities.get(name);

        throw new Error(`Could not load entity '${name}'`);
    }

    /**
     * Query builder for the repository
     * @param payload - The payload to query
     * @returns FindOptionsWhere<Entity>
     */
    public static queryBuilder<Entity>(
        payload: object,
    ): FindOptionsWhere<Entity> {
        let query = {};

        for (let key in payload) {
            if (
                (key === 'id' || key === '_id') &&
                typeof payload[key] === 'string'
            )
                query[this.getIdField()] = this.fixId(payload[key]);
            else if (
                (key === 'id' || key === '_id') &&
                typeof payload[key] === 'object'
            )
                query[this.getIdField()] = this.fixObjectIds(payload[key]);
            else query[key] = payload[key];
        }

        return query as FindOptionsWhere<Entity>;
    }

    /**
     * Find a single entity by criteria
     * @param entity - The entity type
     * @param criteria - The criteria to find the entity by
     * @param options - The options to find the entity by
     * @returns Entity | null
     */
    public static async findBy<Entity>(
        entity: new () => Entity,
        criteria: FindOptionsWhere<Entity>,
        options: FindOneOptions<Entity> = {},
    ): Promise<Entity | null> {
        try {
            const repository = this.getRepository(entity);
            const registry = await repository.findOne({
                where: criteria,
                ...options,
            });

            return registry ? registry : null;
        } catch (e) {
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
    public static async findAll<Entity>(
        entity: new () => Entity,
        queries?: any,
        relations?: [],
        options?: FindManyOptions<Entity>,
    ): Promise<IFindResponse | null> {
        try {
            const isMongoDB = Config.get('repository.type') === 'mongodb';
            const repository = this.getRepository(entity);

            const limit = Math.max(
                1,
                Math.min(100, parseInt(queries?.limit) || 10),
            );
            const offset = Math.max(0, parseInt(queries?.offset) || 0);
            const sortBy = this.escape(queries?.sortBy || 'id');
            const sort: 'ASC' | 'DESC' =
                queries?.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            const search = this.escape(queries?.search || '');
            const searchField = escape(queries?.searchField || '');
            const filters = queries ? { ...queries } : {};

            delete filters.limit;
            delete filters.offset;
            delete filters.sortBy;
            delete filters.sort;
            delete filters.search;
            delete filters.searchField;
            const where: any = {};

            if (search && searchField) {
                if (isMongoDB)
                    where[searchField] = { $regex: new RegExp(search, 'i') };
                else where[searchField] = Like(`%${search}%`);
            }

            Object.entries(filters).forEach(([key, value]) => {
                where[key] = this.escape(value);
            });

            if (!options) options = {};

            const order: FindOptionsOrder<Entity> = {
                [sortBy]: sort,
            } as FindOptionsOrder<Entity>;

            const queryOptions: FindManyOptions<Entity> = {
                where,
                relations,
                take: limit,
                skip: offset,
                order,
                ...options,
            };

            const total = await repository.count(queryOptions.where as any);
            const results = await repository.find(queryOptions);

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
        } catch (error) {
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
    public static async insert<Entity>(
        entity: new () => Entity,
        data: DeepPartial<Entity>,
    ): Promise<IInsertResponse> {
        try {
            const repository = this.getRepository(entity);
            const newEntity = repository.create(data);
            return { data: await repository.save(newEntity), success: true };
        } catch (e) {
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
    public static async insertIfNotExists<Entity>(
        entity: new () => Entity,
        data: DeepPartial<Entity>,
        fieldFilter: string,
    ) {
        try {
            let criteria = {};
            criteria[fieldFilter] = data[fieldFilter];
            const repository = this.getRepository(entity);
            const exists = await repository.findOne({ where: criteria });

            if (!exists) {
                const newEntity = repository.create(data);
                await repository.save(newEntity);
            }
        } catch (e) {
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
    public static async update<Entity>(
        entity: new () => Entity,
        id: any,
        data: any,
    ): Promise<number> {
        try {
            const repository = this.getRepository(entity);
            const result = await repository.update(id, data);
            return result.affected;
        } catch (e) {
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
    public static async updateOne<Entity>(
        entity: new () => Entity,
        criteria: FindOptionsWhere<Entity>,
        data: Partial<Entity>,
    ) {
        try {
            const repository = this.getRepository(entity);
            const existingRecord = await repository.findOne({
                where: criteria,
            });

            if (!existingRecord) return false;

            Object.assign(existingRecord, data);
            await repository.save(existingRecord);
            return true;
        } catch (e) {
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
    public static async updateById<Entity>(
        entity: new () => Entity,
        id: any,
        data: Partial<Entity>,
    ) {
        try {
            const repository = this.getRepository(entity);

            const query = {
                [this.getIdField()]: this.fixId(id),
            } as FindOptionsWhere<Entity>;

            const existingRecord = await repository.findOne({
                where: query,
                select: {
                    [this.getIdField()]: true,
                } as FindOptionsSelect<Entity>,
            });

            if (!existingRecord) return false;

            Object.assign(existingRecord, data);
            await repository.save(existingRecord);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Delete an entity from the repository
     * @param entity - The entity type
     * @param id - The ID of the entity
     * @returns number
     */
    public static async delete<Entity>(
        entity: new () => Entity,
        id: any,
    ): Promise<number> {
        try {
            const repository = this.getRepository(entity);
            const result = await repository.delete(id);
            return result.affected;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Check if an entity exists in the repository
     * @param entity - The entity type
     * @param criteria - The criteria to check if the entity exists by
     * @returns boolean
     */
    public static async exists<Entity>(
        entity: new () => Entity,
        criteria: FindOptionsWhere<Entity>,
    ): Promise<boolean> {
        try {
            const repository = this.getRepository(entity);

            const result = await repository.findOne({
                where: criteria,
                select: {
                    [this.getIdField()]: true,
                } as FindOptionsSelect<Entity>,
            });

            return result !== null;
        } catch (e) {
            return false;
        }
    }

    /**
     * List all databases
     * @returns { databases: string[] }
     */
    public static async listDatabases(): Promise<{ databases: string[] }> {
        const instance = this.getInstance();
        const type = Config.get('repository.type');

        if (type === 'mongodb') {
            const client = new MongoClient(Repository.generateMongoUrl());
            const conn = await client.connect();
            const result: any = await conn.db().admin().listDatabases();
            return { databases: result.databases.map((db) => db.name) };
        }
        if (type === 'sqlite') {
            throw new Error(`SQLite does not support database listing`);
        } else {
            const queryRunner = instance.dataSource.createQueryRunner();
            const databases = await queryRunner.query('SHOW DATABASES');
            await queryRunner.release();
            return {
                databases: databases.map((db: any) => Object.values(db)[0]),
            };
        }
    }

    /**
     * List all tables in a database
     * @param database - The database to list the tables from
     * @returns { tables: string[] }
     */
    public static async listTables(
        database: string,
    ): Promise<{ tables: string[] }> {
        const instance = this.getInstance();
        const type = Config.get('repository.type');

        if (type === 'mongodb') {
            const client = new MongoClient(Repository.generateMongoUrl());
            const conn = await client.connect();
            const result: any = await conn
                .db(database)
                .listCollections()
                .toArray();
            return { tables: result.map((collection) => collection.name) };
        } else {
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
                    throw new Error(
                        `Database type '${type}' is not supported for table listing.`,
                    );
            }

            const result = await queryRunner.query(query);
            await queryRunner.release();
            return { tables: result.map((row: any) => Object.values(row)[0]) };
        }
    }

    /**
     * List all indexes for a table
     * @param table - The table to list the indexes from
     * @returns any[]
     */
    public static async listIndexes(table: string): Promise<any[]> {
        try {
            const queryRunner =
                this.getInstance().dataSource.createQueryRunner();
            const indexes = await queryRunner.getTable(table);
            await queryRunner.release();
            return indexes ? indexes.indices : [];
        } catch (error) {
            Repository.logger.error(
                `Error listing indexes for ${table}: ${error.message}`,
            );
            return [];
        }
    }

    /**
     * Create a table in the repository
     * @param tableName - The name of the table to create
     * @param columns - The columns to create in the table
     * @returns boolean
     */
    public static async createTable(
        tableName: string,
        columns: any[],
    ): Promise<boolean> {
        try {
            const queryRunner =
                this.getInstance().dataSource.createQueryRunner();
            await queryRunner.createTable(
                new Table({
                    name: tableName,
                    columns: columns,
                }),
            );
            await queryRunner.release();
            return true;
        } catch (error) {
            Repository.logger.error(
                `Error creating table ${tableName}: ${error.message}`,
            );
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
    public static async updateIndex(
        table: string,
        indexName: string,
        newIndexDefinition: any,
    ): Promise<boolean> {
        try {
            const queryRunner =
                this.getInstance().dataSource.createQueryRunner();
            const tableSchema = await queryRunner.getTable(table);
            if (!tableSchema) return false;

            const existingIndex = tableSchema.indices.find(
                (index) => index.name === indexName,
            );
            if (existingIndex) await queryRunner.dropIndex(table, indexName);

            await queryRunner.createIndex(
                table,
                new TableIndex(newIndexDefinition),
            );
            await queryRunner.release();
            return true;
        } catch (error) {
            Repository.logger.error(
                `Error updating index ${indexName} on table ${table}: ${error.message}`,
            );
            return false;
        }
    }

    /**
     * Remove an index from a table
     * @param table - The table to remove the index from
     * @param indexName - The name of the index to remove
     * @returns boolean
     */
    public static async removeIndex(
        table: string,
        indexName: string,
    ): Promise<boolean> {
        try {
            const queryRunner =
                this.getInstance().dataSource.createQueryRunner();
            await queryRunner.dropIndex(table, indexName);
            await queryRunner.release();
            return true;
        } catch (error) {
            Repository.logger.error(
                `Error removing index ${indexName} from table ${table}: ${error.message}`,
            );
            return false;
        }
    }

    /**
     * List all fields for a table
     * @param table - The table to list the fields from
     * @returns any[]
     */
    public static async listFields(table: string): Promise<any[]> {
        try {
            const queryRunner =
                this.getInstance().dataSource.createQueryRunner();
            const tableSchema = await queryRunner.getTable(table);
            await queryRunner.release();
            return tableSchema ? tableSchema.columns : [];
        } catch (error) {
            Repository.logger.error(
                `Error listing fields for ${table}: ${error.message}`,
            );
            return [];
        }
    }
}

export class RepositorySchema<Entity, T> {
    /**
     * Constructor for the RepositorySchema class
     * @param entity - The entity type
     * @param model - The model type
     * @param fakeDelete - Whether to fake delete entities
     * @param timestamps - Whether to include timestamps in entities
     * @param userAction - Whether to include user action in entities
     */
    constructor(
        private readonly entity: new () => Entity,
        private readonly model: T,
        private readonly fakeDelete: boolean = false,
        private readonly timestamps: boolean = false,
        private readonly userAction: boolean = false,
    ) {}

    /**
     * Get all entities
     * @param queries - The queries to get the entities by
     * @param req - The request object
     * @param options - The options to get the entities by
     * @returns IFindResponse
     */
    public async getAll(queries?: any, req?: any, options?: IFindOptions) {
        if (this.fakeDelete) queries.deleted = false;

        let result = await Repository.findAll(this.entity, queries);

        if (Config.get('repository.type') === 'mongodb')
            result = this.fixIds(result);

        if (!result) throw new Error('Unable to return a valid result.');

        let resultModels =
            result && result.data.length > 0
                ? result.data //@ts-ignore
                      .map((item) => this.model.fromEntity(item))
                : [];

        if (options && options.resolvers) {
            const resolvers = Array.isArray(options.resolvers)
                ? options.resolvers
                : [options.resolvers];
            for (let keyResolver in resolvers) {
                if (Resolvers.has(resolvers[keyResolver])) {
                    for (let key in resultModels) {
                        resultModels[key] = await Resolvers.execute(
                            resolvers[keyResolver],
                            resultModels[key],
                        );
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
    public async getIn(inArr: Array<any>, options?: IFindOptions) {
        const inToAssign = Array.isArray(inArr) ? inArr : [inArr];
        let query = {};

        if (this.fakeDelete) {
            query = Repository.queryBuilder({
                id: { $in: inToAssign },
                deleted: false,
            });
        } else {
            query = Repository.queryBuilder({
                id: { $in: inToAssign },
            });
        }

        const result = await Repository.findAll(this.entity, query);

        let resultModels =
            result && result.data.length > 0
                ? result.data //@ts-ignore
                      .map((item) => this.model.fromEntity(item))
                : [];

        if (options && options.resolvers) {
            const resolvers = Array.isArray(options.resolvers)
                ? options.resolvers
                : [options.resolvers];
            for (let keyResolver in resolvers) {
                if (Resolvers.has(resolvers[keyResolver])) {
                    for (let key in resultModels) {
                        resultModels[key] = await Resolvers.execute(
                            resolvers[keyResolver],
                            resultModels[key],
                        );
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
    public async getById(id, options?: IFindOptions) {
        let query = {};

        if (this.fakeDelete)
            query = Repository.queryBuilder({ id, deleted: false });
        else query = Repository.queryBuilder({ id });

        let result = await Repository.findBy(this.entity, query);

        if (Config.get('repository.type') === 'mongodb')
            result = this.fixIds(result);

        if (!result) throw new Error('Unable to return a valid result.');

        //@ts-ignore
        let resultModel = this.model.fromEntity(result);

        if (options && options.resolvers) {
            const resolvers = Array.isArray(options.resolvers)
                ? options.resolvers
                : [options.resolvers];
            for (let keyResolver in resolvers) {
                if (Resolvers.has(resolvers[keyResolver])) {
                    resultModel = await Resolvers.execute(
                        resolvers[keyResolver],
                        resultModel,
                    );
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
    public async insert(data: any): Promise<any> {
        const result: any = await Repository.insert<Entity>(this.entity, data);

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
    public async update(id: string, data: any) {
        if (data.deleted) delete data.deleted;

        let result = 0;

        let dataToUpdate = this.timestamps
            ? {
                  ...data,
                  updatedAt: new Date(),
              }
            : data;

        if (this.fakeDelete) {
            result = await Repository.update(
                this.entity,
                Repository.queryBuilder({ id, deleted: false }),
                dataToUpdate,
            );
        } else {
            result = await Repository.update(
                this.entity,
                Repository.queryBuilder({ id }),
                dataToUpdate,
            );
        }

        return { success: result > 0, affected: result };
    }

    /**
     * Delete an entity from the repository
     * @param id - The ID of the entity
     * @returns { success: boolean, affected: number }
     */
    public async delete(id: string) {
        let result = 0;

        if (this.fakeDelete) {
            result = await Repository.update(
                this.entity,
                Repository.queryBuilder({ id }),
                {
                    deleted: true,
                    deletedAt: new Date(),
                },
            );
        } else {
            result = await Repository.delete(
                this.entity,
                Repository.queryBuilder({ id }),
            );
        }

        return { success: result > 0, affected: result };
    }

    /**
     * Fix the IDs for the repository
     * @param item - The item to fix the IDs for
     * @param subtree - Whether to fix the IDs for a subtree
     * @returns any
     */
    protected fixIds(item: any, subtree: boolean = false) {
        if (item && typeof item === 'object') {
            if (item._id) {
                item.id = item._id.toString();
                delete item._id;
            }

            for (const key in item) {
                if (Array.isArray(item[key])) {
                    item[key] = item[key].map((element: any) =>
                        this.fixIds(element),
                    );
                } else if (item[key] instanceof ObjectId) {
                    item[key] = item[key].toString();
                } else if (typeof item[key] === 'object' && !subtree) {
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
    protected fromPartial(model: any, data: any, req: any) {
        if (model && model.fromPartial)
            return this.extraData(model?.fromPartial(data), req);
        else return data;
    }

    /**
     * Convert a data object to a model
     * @param model - The model to convert
     * @param data - The data to convert
     * @returns any
     */
    protected toModel(model: any, data: any) {
        const dataFixed =
            Config.get('repository.type') === 'mongodb'
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
    protected extraData(newItem: any, req: any) {
        const userId: string = req?.user?.id;

        if (typeof userId === 'string') {
            try {
                newItem.userCreator =
                    Config.get('repository.type') === 'mongodb'
                        ? new ObjectId(userId)
                        : userId;
            } catch (error) {
                console.warn('Error assigning userCreator:', error);
            }
        }

        return newItem;
    }
}
