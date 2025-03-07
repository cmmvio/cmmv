import * as path from 'path';
import * as fg from 'fast-glob';
import { cwd } from 'process';

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

    public static async loadConfig(): Promise<void> {
        const instance = Repository.getInstance();
        const config = Config.get('repository');

        const sourceDir = Config.get<string>('app.sourceDir', 'src');
        const entitiesDir = path.join(cwd(), sourceDir, 'entities');
        const entitiesGeneratedDir = path.join(cwd(), '.generated', 'entities');
        const entityFiles = await fg([
            `${entitiesDir}/**/*.entity.ts`,
            `${entitiesGeneratedDir}/**/*.entity.ts`,
        ]);

        const entities = await Promise.all(
            entityFiles.map(async (file) => {
                const entityModule = await import(file);
                const entityContructor = Object.values(entityModule)[0];
                this.entities.set(
                    //@ts-ignore
                    entityContructor.name,
                    entityContructor,
                );
                return entityContructor;
            }),
        );

        const AppDataSource = new DataSource({
            ...config,
            entities,
        });

        instance.dataSource = await AppDataSource.initialize();
    }

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

    private static getRepository<Entity>(
        entity: new () => Entity,
    ): TypeORMRepository<Entity> {
        const instance = Repository.getInstance();
        return instance.dataSource.getRepository(entity);
    }

    private static getIdField(): string {
        return Config.get('repository.type') === 'mongodb' ? '_id' : 'id';
    }

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

    public static getEntity(name: string): new () => any | null {
        if (Repository.entities.has(name)) return Repository.entities.get(name);

        throw new Error(`Could not load entity '${name}'`);
    }

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
    constructor(
        private readonly entity: new () => Entity,
        private readonly model: T,
    ) {}

    public async getAll(queries?: any, req?: any, options?: IFindOptions) {
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
                    for (let key in resultModels)
                        resultModels[key] = await Resolvers.execute(
                            resolvers[keyResolver],
                            resultModels[key],
                        );
                }
            }
        }

        return {
            count: result.count,
            pagination: result.pagination,
            data: resultModels,
        };
    }

    public async getIn(inArr: Array<any>, options?: IFindOptions) {
        const inToAssign = Array.isArray(inArr) ? inArr : [inArr];

        const result = await Repository.findAll(
            this.entity,
            Repository.queryBuilder({
                id: { $in: inToAssign },
            }),
        );

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
                    for (let key in resultModels)
                        resultModels[key] = await Resolvers.execute(
                            resolvers[keyResolver],
                            resultModels[key],
                        );
                }
            }
        }

        return {
            count: result.count,
            pagination: result.pagination,
            data: resultModels,
        };
    }

    public async getById(id, options?: IFindOptions) {
        let result = await Repository.findBy(
            this.entity,
            Repository.queryBuilder({ id }),
        );

        if (Config.get('repository.type') === 'mongodb')
            result = this.fixIds(result);

        if (!result) throw new Error('Unable to return a valid result.');

        //@ts-ignore
        let resultModel = this.model.fromEntity(result.data);

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

    public async insert(data: any): Promise<any> {
        const result: any = await Repository.insert<Entity>(this.entity, data);

        if (!result.success)
            throw new Error(result.message || 'Insert operation failed');

        return this.toModel(this.model, result.data);
    }

    public async update(id: string, data: any) {
        const result = await Repository.update(
            this.entity,
            Repository.queryBuilder({ id }),
            {
                ...data,
                updatedAt: new Date(),
            },
        );

        return { success: result > 0, affected: result };
    }

    public async delete(id: string) {
        const result = await Repository.delete(
            this.entity,
            Repository.queryBuilder({ id }),
        );

        return { success: result > 0, affected: result };
    }

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

    protected fromPartial(model: any, data: any, req: any) {
        if (model && model.fromPartial)
            return this.extraData(model?.fromPartial(data), req);
        else return data;
    }

    protected toModel(model: any, data: any) {
        const dataFixed =
            Config.get('repository.type') === 'mongodb'
                ? this.fixIds(data)
                : data;

        return model && model.fromEntity
            ? model.fromEntity(dataFixed)
            : dataFixed;
    }

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
