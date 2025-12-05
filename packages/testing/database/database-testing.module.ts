import { vi } from 'vitest';

/**
 * Database configuration options for testing
 */
export interface IDatabaseTestConfig {
    /** Database type (sqlite, postgres, mysql, mongodb) */
    type?: 'sqlite' | 'postgres' | 'mysql' | 'mongodb' | 'better-sqlite3';
    /** Database name */
    database?: string;
    /** Use in-memory database (for SQLite) */
    inMemory?: boolean;
    /** Synchronize database schema */
    synchronize?: boolean;
    /** Drop schema before each test */
    dropSchema?: boolean;
    /** Logging enabled */
    logging?: boolean;
    /** Entity classes to use */
    entities?: any[];
}

/**
 * Transaction context for test isolation
 */
export interface ITransactionContext {
    /** Query runner for the transaction */
    queryRunner: IMockQueryRunner;
    /** Manager for the transaction */
    manager: IMockEntityManager;
    /** Whether the transaction is active */
    isActive: boolean;
    /** Commit the transaction */
    commit(): Promise<void>;
    /** Rollback the transaction */
    rollback(): Promise<void>;
    /** Release the query runner */
    release(): Promise<void>;
}

/**
 * Mock Query Runner interface
 */
export interface IMockQueryRunner {
    connect: ReturnType<typeof vi.fn>;
    startTransaction: ReturnType<typeof vi.fn>;
    commitTransaction: ReturnType<typeof vi.fn>;
    rollbackTransaction: ReturnType<typeof vi.fn>;
    release: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
    manager: IMockEntityManager;
}

/**
 * Mock Entity Manager interface
 */
export interface IMockEntityManager {
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
}

/**
 * Seed data definition
 */
export interface ISeedData<T = any> {
    /** Entity class */
    entity: new () => T;
    /** Data to seed */
    data: Partial<T>[];
}

/**
 * DatabaseTestingModule - Provides database testing utilities
 * for isolated test execution with transaction rollback
 */
export class DatabaseTestingModule {
    private config: IDatabaseTestConfig;
    private mockDataSource: MockTestDataSource;
    private activeTransactions: Map<string, ITransactionContext> = new Map();
    private seededData: Map<string, any[]> = new Map();
    private entityStore: Map<string, any[]> = new Map();

    constructor(config: IDatabaseTestConfig = {}) {
        this.config = {
            type: 'sqlite',
            database: ':memory:',
            inMemory: true,
            synchronize: true,
            dropSchema: true,
            logging: false,
            entities: [],
            ...config,
        };
        this.mockDataSource = new MockTestDataSource(this.config);
    }

    /**
     * Initialize the database testing module
     */
    async initialize(): Promise<void> {
        await this.mockDataSource.initialize();
    }

    /**
     * Close the database connection
     */
    async close(): Promise<void> {
        // Rollback all active transactions
        for (const [id, ctx] of this.activeTransactions) {
            await ctx.rollback();
        }
        this.activeTransactions.clear();
        await this.mockDataSource.destroy();
    }

    /**
     * Get the mock data source
     */
    getDataSource(): MockTestDataSource {
        return this.mockDataSource;
    }

    /**
     * Start a transaction for test isolation
     * All operations will be rolled back after the test
     */
    async startTransaction(): Promise<ITransactionContext> {
        const queryRunner = this.mockDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const transactionId = this.generateId();
        const context: ITransactionContext = {
            queryRunner,
            manager: queryRunner.manager,
            isActive: true,
            commit: async () => {
                if (context.isActive) {
                    await queryRunner.commitTransaction();
                    context.isActive = false;
                }
            },
            rollback: async () => {
                if (context.isActive) {
                    await queryRunner.rollbackTransaction();
                    context.isActive = false;
                }
            },
            release: async () => {
                await queryRunner.release();
                this.activeTransactions.delete(transactionId);
            },
        };

        this.activeTransactions.set(transactionId, context);
        return context;
    }

    /**
     * Run a test within a transaction that will be rolled back
     */
    async runInTransaction<T>(
        callback: (ctx: ITransactionContext) => Promise<T>,
    ): Promise<T> {
        const ctx = await this.startTransaction();
        try {
            const result = await callback(ctx);
            await ctx.rollback(); // Always rollback test transactions
            return result;
        } finally {
            await ctx.release();
        }
    }

    /**
     * Seed the database with test data
     */
    async seed<T>(entity: new () => T, data: Partial<T>[]): Promise<T[]> {
        const entityName = entity.name;
        const seeded: T[] = [];

        for (const item of data) {
            const created = this.mockDataSource.createEntity(entity, item);
            seeded.push(created);
        }

        // Store seeded data for reference
        const existing = this.seededData.get(entityName) || [];
        this.seededData.set(entityName, [...existing, ...seeded]);

        // Store in entity store for queries
        const stored = this.entityStore.get(entityName) || [];
        this.entityStore.set(entityName, [...stored, ...seeded]);

        return seeded;
    }

    /**
     * Seed multiple entities at once
     */
    async seedMany(seeds: ISeedData[]): Promise<Map<string, any[]>> {
        const results = new Map<string, any[]>();

        for (const seed of seeds) {
            const seeded = await this.seed(seed.entity, seed.data);
            results.set(seed.entity.name, seeded);
        }

        return results;
    }

    /**
     * Clear all seeded data
     */
    async clearSeededData(): Promise<void> {
        this.seededData.clear();
        this.entityStore.clear();
    }

    /**
     * Clear data for a specific entity
     */
    async clearEntity<T>(entity: new () => T): Promise<void> {
        const entityName = entity.name;
        this.seededData.delete(entityName);
        this.entityStore.delete(entityName);
    }

    /**
     * Get seeded data for an entity
     */
    getSeededData<T>(entity: new () => T): T[] {
        return (this.seededData.get(entity.name) || []) as T[];
    }

    /**
     * Get a mock repository for an entity
     */
    getRepository<T>(entity: new () => T): MockTestRepository<T> {
        return new MockTestRepository<T>(entity, this.entityStore);
    }

    /**
     * Reset the database state
     */
    async reset(): Promise<void> {
        await this.clearSeededData();

        // Rollback all transactions
        for (const [id, ctx] of this.activeTransactions) {
            await ctx.rollback();
            await ctx.release();
        }
        this.activeTransactions.clear();

        // Reset mock data source
        this.mockDataSource.reset();
    }

    /**
     * Create a fixture factory
     */
    createFixtureFactory<T>(
        entity: new () => T,
        defaults: Partial<T> = {},
    ): FixtureFactory<T> {
        return new FixtureFactory<T>(entity, defaults);
    }

    private generateId(): string {
        return 'tx-' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * Mock Test DataSource
 */
export class MockTestDataSource {
    private _isInitialized: boolean = false;
    private queryRunners: IMockQueryRunner[] = [];

    constructor(private config: IDatabaseTestConfig) {}

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    initialize = vi.fn(async () => {
        this._isInitialized = true;
    });

    destroy = vi.fn(async () => {
        this._isInitialized = false;
    });

    createQueryRunner(): IMockQueryRunner {
        const manager = this.createEntityManager();
        const queryRunner: IMockQueryRunner = {
            connect: vi.fn().mockResolvedValue(undefined),
            startTransaction: vi.fn().mockResolvedValue(undefined),
            commitTransaction: vi.fn().mockResolvedValue(undefined),
            rollbackTransaction: vi.fn().mockResolvedValue(undefined),
            release: vi.fn().mockResolvedValue(undefined),
            query: vi.fn().mockResolvedValue([]),
            manager,
        };

        this.queryRunners.push(queryRunner);
        return queryRunner;
    }

    createEntityManager(): IMockEntityManager {
        return {
            save: vi.fn().mockImplementation((data) => Promise.resolve(data)),
            remove: vi.fn().mockResolvedValue(undefined),
            find: vi.fn().mockResolvedValue([]),
            findOne: vi.fn().mockResolvedValue(null),
            update: vi.fn().mockResolvedValue({ affected: 1 }),
            delete: vi.fn().mockResolvedValue({ affected: 1 }),
            insert: vi.fn().mockResolvedValue({ identifiers: [{ id: 1 }] }),
            createQueryBuilder: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                orWhere: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                offset: vi.fn().mockReturnThis(),
                getMany: vi.fn().mockResolvedValue([]),
                getOne: vi.fn().mockResolvedValue(null),
                execute: vi.fn().mockResolvedValue({ affected: 0 }),
            }),
        };
    }

    createEntity<T>(entity: new () => T, data: Partial<T>): T {
        const instance = new entity();
        Object.assign(instance, {
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
        });
        return instance;
    }

    getRepository = vi.fn().mockReturnValue({
        find: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockImplementation((data) => Promise.resolve(data)),
        update: vi.fn().mockResolvedValue({ affected: 1 }),
        delete: vi.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            getMany: vi.fn().mockResolvedValue([]),
            getOne: vi.fn().mockResolvedValue(null),
        }),
    });

    query = vi.fn().mockResolvedValue([]);

    reset(): void {
        this.initialize.mockClear();
        this.destroy.mockClear();
        this.getRepository.mockClear();
        this.query.mockClear();
        this.queryRunners = [];
    }

    private generateId(): string {
        return 'id-' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * Mock Test Repository
 */
export class MockTestRepository<T> {
    constructor(
        private entity: new () => T,
        private store: Map<string, any[]>,
    ) {}

    private get entityName(): string {
        return this.entity.name;
    }

    private get data(): T[] {
        return (this.store.get(this.entityName) || []) as T[];
    }

    private set data(value: T[]) {
        this.store.set(this.entityName, value);
    }

    find = vi.fn(async (options?: any): Promise<T[]> => {
        let results = [...this.data];

        if (options?.where) {
            results = results.filter((item) =>
                this.matchWhere(item, options.where),
            );
        }

        if (options?.order) {
            const [field, direction] = Object.entries(options.order)[0] as [
                string,
                string,
            ];
            results.sort((a: any, b: any) => {
                if (direction === 'DESC') return b[field] > a[field] ? 1 : -1;
                return a[field] > b[field] ? 1 : -1;
            });
        }

        if (options?.skip) {
            results = results.slice(options.skip);
        }

        if (options?.take) {
            results = results.slice(0, options.take);
        }

        return results;
    });

    findOne = vi.fn(async (options?: any): Promise<T | null> => {
        const results = await this.find(options);
        return results[0] || null;
    });

    findOneBy = vi.fn(async (where: any): Promise<T | null> => {
        return this.findOne({ where });
    });

    save = vi.fn(async (entity: Partial<T>): Promise<T> => {
        const existing = this.data.find(
            (item: any) => item.id === (entity as any).id,
        );

        if (existing) {
            Object.assign(existing, entity, { updatedAt: new Date() });
            return existing;
        }

        const newEntity = {
            id: 'id-' + Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...entity,
        } as T;

        this.data = [...this.data, newEntity];
        return newEntity;
    });

    update = vi.fn(
        async (
            criteria: any,
            data: Partial<T>,
        ): Promise<{ affected: number }> => {
            let affected = 0;

            this.data = this.data.map((item: any) => {
                if (this.matchWhere(item, criteria)) {
                    Object.assign(item, data, { updatedAt: new Date() });
                    affected++;
                }
                return item;
            });

            return { affected };
        },
    );

    delete = vi.fn(async (criteria: any): Promise<{ affected: number }> => {
        const originalLength = this.data.length;
        this.data = this.data.filter(
            (item) => !this.matchWhere(item, criteria),
        );
        return { affected: originalLength - this.data.length };
    });

    count = vi.fn(async (options?: any): Promise<number> => {
        const results = await this.find(options);
        return results.length;
    });

    create = vi.fn((data: Partial<T>): T => {
        return {
            id: 'id-' + Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
        } as T;
    });

    clear = vi.fn(async (): Promise<void> => {
        this.data = [];
    });

    createQueryBuilder = vi.fn((alias?: string) => {
        return new MockQueryBuilder<T>(this.data);
    });

    private matchWhere(item: any, where: any): boolean {
        for (const [key, value] of Object.entries(where)) {
            if (item[key] !== value) return false;
        }
        return true;
    }

    reset(): void {
        this.find.mockClear();
        this.findOne.mockClear();
        this.findOneBy.mockClear();
        this.save.mockClear();
        this.update.mockClear();
        this.delete.mockClear();
        this.count.mockClear();
        this.create.mockClear();
        this.clear.mockClear();
        this.createQueryBuilder.mockClear();
    }
}

/**
 * Mock Query Builder
 */
export class MockQueryBuilder<T> {
    private whereConditions: any[] = [];
    private orderByField: string | null = null;
    private orderDirection: 'ASC' | 'DESC' = 'ASC';
    private limitValue: number | null = null;
    private offsetValue: number | null = null;

    constructor(private data: T[]) {}

    where = vi.fn((condition: any): MockQueryBuilder<T> => {
        this.whereConditions = [condition];
        return this;
    });

    andWhere = vi.fn((condition: any): MockQueryBuilder<T> => {
        this.whereConditions.push(condition);
        return this;
    });

    orWhere = vi.fn((condition: any): MockQueryBuilder<T> => {
        this.whereConditions.push({ $or: condition });
        return this;
    });

    orderBy = vi.fn(
        (
            field: string,
            direction: 'ASC' | 'DESC' = 'ASC',
        ): MockQueryBuilder<T> => {
            this.orderByField = field;
            this.orderDirection = direction;
            return this;
        },
    );

    limit = vi.fn((limit: number): MockQueryBuilder<T> => {
        this.limitValue = limit;
        return this;
    });

    offset = vi.fn((offset: number): MockQueryBuilder<T> => {
        this.offsetValue = offset;
        return this;
    });

    skip = vi.fn((skip: number): MockQueryBuilder<T> => {
        this.offsetValue = skip;
        return this;
    });

    take = vi.fn((take: number): MockQueryBuilder<T> => {
        this.limitValue = take;
        return this;
    });

    getMany = vi.fn(async (): Promise<T[]> => {
        let results = [...this.data];

        if (this.offsetValue) {
            results = results.slice(this.offsetValue);
        }

        if (this.limitValue) {
            results = results.slice(0, this.limitValue);
        }

        return results;
    });

    getOne = vi.fn(async (): Promise<T | null> => {
        const results = await this.getMany();
        return results[0] || null;
    });

    getCount = vi.fn(async (): Promise<number> => {
        return this.data.length;
    });

    execute = vi.fn(async (): Promise<{ affected: number }> => {
        return { affected: 0 };
    });

    reset(): void {
        this.where.mockClear();
        this.andWhere.mockClear();
        this.orWhere.mockClear();
        this.orderBy.mockClear();
        this.limit.mockClear();
        this.offset.mockClear();
        this.skip.mockClear();
        this.take.mockClear();
        this.getMany.mockClear();
        this.getOne.mockClear();
        this.getCount.mockClear();
        this.execute.mockClear();
    }
}

/**
 * Fixture Factory for creating test data
 */
export class FixtureFactory<T> {
    private sequence: number = 0;

    constructor(
        private entity: new () => T,
        private defaults: Partial<T> = {},
    ) {}

    /**
     * Create a single fixture
     */
    create(overrides: Partial<T> = {}): T {
        this.sequence++;
        const instance = new this.entity();
        Object.assign(instance, {
            id: `id-${this.sequence}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...this.defaults,
            ...overrides,
        });
        return instance;
    }

    /**
     * Create multiple fixtures
     */
    createMany(
        count: number,
        overrides: Partial<T> | ((index: number) => Partial<T>) = {},
    ): T[] {
        return Array.from({ length: count }, (_, index) => {
            const entityOverrides =
                typeof overrides === 'function' ? overrides(index) : overrides;
            return this.create(entityOverrides);
        });
    }

    /**
     * Build a fixture without saving
     */
    build(overrides: Partial<T> = {}): Partial<T> {
        this.sequence++;
        return {
            id: `id-${this.sequence}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...this.defaults,
            ...overrides,
        } as Partial<T>;
    }

    /**
     * Build multiple fixtures without saving
     */
    buildMany(
        count: number,
        overrides: Partial<T> | ((index: number) => Partial<T>) = {},
    ): Partial<T>[] {
        return Array.from({ length: count }, (_, index) => {
            const entityOverrides =
                typeof overrides === 'function' ? overrides(index) : overrides;
            return this.build(entityOverrides);
        });
    }

    /**
     * Reset sequence counter
     */
    resetSequence(): void {
        this.sequence = 0;
    }
}

/**
 * Create a database testing module
 */
export function createDatabaseTestingModule(
    config?: IDatabaseTestConfig,
): DatabaseTestingModule {
    return new DatabaseTestingModule(config);
}

/**
 * Create a fixture factory
 */
export function createFixtureFactory<T>(
    entity: new () => T,
    defaults?: Partial<T>,
): FixtureFactory<T> {
    return new FixtureFactory<T>(entity, defaults);
}

/**
 * Test helper to run tests with database isolation
 */
export async function withTestDatabase<T>(
    callback: (db: DatabaseTestingModule) => Promise<T>,
    config?: IDatabaseTestConfig,
): Promise<T> {
    const db = createDatabaseTestingModule(config);
    await db.initialize();

    try {
        return await callback(db);
    } finally {
        await db.close();
    }
}

/**
 * Test helper to run tests within a transaction
 */
export async function withTransaction<T>(
    db: DatabaseTestingModule,
    callback: (ctx: ITransactionContext) => Promise<T>,
): Promise<T> {
    return db.runInTransaction(callback);
}
