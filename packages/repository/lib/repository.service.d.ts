import { DataSource, Repository as TypeORMRepository, FindOptionsWhere, DeepPartial, FindManyOptions, FindOneOptions } from 'typeorm';
import { Logger, Singleton, LogEvent } from '@cmmv/core';
import { IFindResponse, IInsertResponse, IFindOptions } from './repository.interface';
export declare class Repository extends Singleton {
    static logger: Logger;
    static entities: Map<string, any>;
    static logEntity: any;
    dataSource: DataSource;
    /**
     * Load the repository configuration and initialize the database connection
     * @returns Promise<void>
     */
    static loadConfig(): Promise<void>;
    static log(message: LogEvent): Promise<void>;
    /**
     * Get the data source instance
     * @returns DataSource
     */
    static getDataSource(): DataSource;
    /**
     * Generate a MongoDB connection URL
     * @returns string
     */
    static generateMongoUrl(): string;
    /**
     * Get a repository instance for a given entity
     * @param entity - The entity type
     * @returns TypeORMRepository<Entity>
     */
    static getRepository<Entity>(entity: new () => Entity): TypeORMRepository<Entity>;
    /**
     * Get the ID field for the repository
     * @returns string
     */
    private static getIdField;
    /**
     * Fix the ID for the repository
     * @param id - The ID to fix
     * @returns ObjectId | string
     */
    private static fixId;
    /**
     * Fix the ID for the repository
     * @param value - The value to fix
     * @returns ObjectId | string
     */
    static fixObjectIds(value: any): any;
    /**
     * Escape a string for the repository
     * @param str - The string to escape
     * @returns string
     */
    private static escape;
    /**
     * Get an entity for the repository
     * @param name - The name of the entity
     * @returns new () => any | null
     */
    static getEntity(name: string): new () => any | null;
    /**
     * Query builder for the repository
     * @param payload - The payload to query
     * @returns FindOptionsWhere<Entity>
     */
    static queryBuilder<Entity>(payload: object): FindOptionsWhere<Entity>;
    /**
     * Find a single entity by criteria
     * @param entity - The entity type
     * @param criteria - The criteria to find the entity by
     * @param options - The options to find the entity by
     * @returns Entity | null
     */
    static findBy<Entity>(entity: new () => Entity, criteria: FindOptionsWhere<Entity>, options?: FindOneOptions<Entity>): Promise<Entity | null>;
    /**
     * Find all entities by criteria
     * @param entity - The entity type
     * @param queries - The queries to find the entities by
     * @param relations - The relations to find the entities by
     * @param options - The options to find the entities by
     * @returns IFindResponse | null
     */
    static findAll<Entity>(entity: new () => Entity, queries?: any, relations?: [], options?: FindManyOptions<Entity>): Promise<IFindResponse | null>;
    /**
     * Insert an entity into the repository
     * @param entity - The entity type
     * @param data - The data to insert
     * @returns IInsertResponse
     */
    static insert<Entity>(entity: new () => Entity, data: DeepPartial<Entity>): Promise<IInsertResponse>;
    /**
     * Insert an entity into the repository if it does not exist
     * @param entity - The entity type
     * @param data - The data to insert
     * @param fieldFilter - The field to filter by
     * @returns boolean
     */
    static insertIfNotExists<Entity>(entity: new () => Entity, data: DeepPartial<Entity>, fieldFilter: string): Promise<boolean>;
    /**
     * Update an entity in the repository
     * @param entity - The entity type
     * @param id - The ID of the entity
     * @param data - The data to update
     * @returns number
     */
    static update<Entity>(entity: new () => Entity, id: any, data: any): Promise<number>;
    /**
     * Update an entity in the repository by criteria
     * @param entity - The entity type
     * @param criteria - The criteria to update the entity by
     * @param data - The data to update
     * @returns boolean
     */
    static updateOne<Entity>(entity: new () => Entity, criteria: FindOptionsWhere<Entity>, data: Partial<Entity>): Promise<boolean>;
    /**
     * Update an entity in the repository by ID
     * @param entity - The entity type
     * @param id - The ID of the entity
     * @param data - The data to update
     * @returns boolean
     */
    static updateById<Entity>(entity: new () => Entity, id: any, data: Partial<Entity>): Promise<boolean>;
    /**
     * Delete an entity from the repository
     * @param entity - The entity type
     * @param id - The ID of the entity
     * @returns number
     */
    static delete<Entity>(entity: new () => Entity, id: any): Promise<number>;
    /**
     * Check if an entity exists in the repository
     * @param entity - The entity type
     * @param criteria - The criteria to check if the entity exists by
     * @returns boolean
     */
    static exists<Entity>(entity: new () => Entity, criteria: FindOptionsWhere<Entity>): Promise<boolean>;
    /**
     * List all databases
     * @returns { databases: string[] }
     */
    static listDatabases(): Promise<{
        databases: string[];
    }>;
    /**
     * List all tables in a database
     * @param database - The database to list the tables from
     * @returns { tables: string[] }
     */
    static listTables(database: string): Promise<{
        tables: string[];
    }>;
    /**
     * List all indexes for a table
     * @param table - The table to list the indexes from
     * @returns any[]
     */
    static listIndexes(table: string): Promise<any[]>;
    /**
     * Create a table in the repository
     * @param tableName - The name of the table to create
     * @param columns - The columns to create in the table
     * @returns boolean
     */
    static createTable(tableName: string, columns: any[]): Promise<boolean>;
    /**
     * Update an index in the repository
     * @param table - The table to update the index on
     * @param indexName - The name of the index to update
     * @param newIndexDefinition - The new index definition
     * @returns boolean
     */
    static updateIndex(table: string, indexName: string, newIndexDefinition: any): Promise<boolean>;
    /**
     * Remove an index from a table
     * @param table - The table to remove the index from
     * @param indexName - The name of the index to remove
     * @returns boolean
     */
    static removeIndex(table: string, indexName: string): Promise<boolean>;
    /**
     * List all fields for a table
     * @param table - The table to list the fields from
     * @returns any[]
     */
    static listFields(table: string): Promise<any[]>;
}
export declare class RepositorySchema<Entity, T> {
    private readonly entity;
    private readonly model;
    private readonly fakeDelete;
    private readonly timestamps;
    private readonly userAction;
    /**
     * Constructor for the RepositorySchema class
     * @param entity - The entity type
     * @param model - The model type
     * @param fakeDelete - Whether to fake delete entities
     * @param timestamps - Whether to include timestamps in entities
     * @param userAction - Whether to include user action in entities
     */
    constructor(entity: new () => Entity, model: T, fakeDelete?: boolean, timestamps?: boolean, userAction?: boolean);
    /**
     * Get all entities
     * @param queries - The queries to get the entities by
     * @param req - The request object
     * @param options - The options to get the entities by
     * @returns IFindResponse
     */
    getAll(queries?: any, req?: any, options?: IFindOptions): Promise<{
        count: number;
        pagination: import("./repository.interface").IFindPagination;
        data: any;
    }>;
    /**
     * Get entities by in array
     * @param inArr - The in array
     * @param options - The options to get the entities by
     * @returns IFindResponse
     */
    getIn(inArr: Array<any>, options?: IFindOptions): Promise<{
        count: number;
        pagination: import("./repository.interface").IFindPagination;
        data: any;
    }>;
    /**
     * Get an entity by ID
     * @param id - The ID of the entity
     * @param options - The options to get the entity by
     * @returns IFindResponse
     */
    getById(id: any, options?: IFindOptions): Promise<{
        count: number;
        pagination: {
            limit: number;
            offset: number;
            search: any;
            searchField: string;
            sortBy: string;
            sort: string;
            filters: {};
        };
        data: any;
    }>;
    /**
     * Insert an entity into the repository
     * @param data - The data to insert
     * @returns any
     */
    insert(data: any): Promise<any>;
    /**
     * Update an entity in the repository
     * @param id - The ID of the entity
     * @param data - The data to update
     * @returns number
     */
    update(id: string, data: any): Promise<{
        success: boolean;
        affected: number;
    }>;
    /**
     * Delete an entity from the repository
     * @param id - The ID of the entity
     * @returns { success: boolean, affected: number }
     */
    delete(id: string): Promise<{
        success: boolean;
        affected: number;
    }>;
    /**
     * Fix the IDs for the repository
     * @param item - The item to fix the IDs for
     * @param subtree - Whether to fix the IDs for a subtree
     * @returns any
     */
    protected fixIds(item: any, subtree?: boolean): any;
    /**
     * Convert a partial model to a full model
     * @param model - The model to convert
     * @param data - The data to convert
     * @param req - The request object
     * @returns any
     */
    protected fromPartial(model: any, data: any, req: any): any;
    /**
     * Convert a data object to a model
     * @param model - The model to convert
     * @param data - The data to convert
     * @returns any
     */
    protected toModel(model: any, data: any): any;
    /**
     * Extra data from the request
     * @param newItem - The new item
     * @param req - The request object
     * @returns any
     */
    protected extraData(newItem: any, req: any): any;
}
