import { vi } from 'vitest';

/**
 * Mock Repository Service
 * Provides mock implementations for all Repository service methods
 */
export const MockRepository = {
    // CRUD operations
    getAll: vi.fn().mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 10 } }),
    getById: vi.fn().mockResolvedValue({ data: null }),
    insert: vi.fn().mockResolvedValue({ success: true, data: {} }),
    update: vi.fn().mockResolvedValue({ success: true }),
    delete: vi.fn().mockResolvedValue({ success: true }),

    // Database operations
    listDatabases: vi.fn().mockResolvedValue({ databases: [] }),
    listTables: vi.fn().mockResolvedValue({ tables: [] }),

    // Query builder
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

    // Transaction support
    transaction: vi.fn().mockImplementation(async (callback) => {
        const mockManager = {
            save: vi.fn().mockResolvedValue({}),
            remove: vi.fn().mockResolvedValue({}),
            findOne: vi.fn().mockResolvedValue(null),
            find: vi.fn().mockResolvedValue([]),
        };
        return callback(mockManager);
    }),

    // Reset all mocks
    reset: () => {
        Object.values(MockRepository).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock Repository Abstract class
 */
export class MockRepositoryAbstract {
    protected repository: any = {
        find: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({ affected: 1 }),
        delete: vi.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            getMany: vi.fn().mockResolvedValue([]),
            getOne: vi.fn().mockResolvedValue(null),
        }),
    };

    async getAll(queries?: any): Promise<any> {
        return MockRepository.getAll(queries);
    }

    async getById(id: string): Promise<any> {
        return MockRepository.getById(id);
    }

    async insert(data: any): Promise<any> {
        return MockRepository.insert(data);
    }

    async update(id: string, data: any): Promise<any> {
        return MockRepository.update(id, data);
    }

    async delete(id: string): Promise<any> {
        return MockRepository.delete(id);
    }
}

/**
 * Mock TypeORM DataSource
 */
export const MockDataSource = {
    isInitialized: true,
    initialize: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    getRepository: vi.fn().mockReturnValue({
        find: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({ affected: 1 }),
        delete: vi.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            getMany: vi.fn().mockResolvedValue([]),
            getOne: vi.fn().mockResolvedValue(null),
        }),
    }),
    query: vi.fn().mockResolvedValue([]),
    transaction: vi.fn().mockImplementation(async (callback) => {
        return callback({
            save: vi.fn().mockResolvedValue({}),
            remove: vi.fn().mockResolvedValue({}),
        });
    }),
    createQueryRunner: vi.fn().mockReturnValue({
        connect: vi.fn().mockResolvedValue(undefined),
        startTransaction: vi.fn().mockResolvedValue(undefined),
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        rollbackTransaction: vi.fn().mockResolvedValue(undefined),
        release: vi.fn().mockResolvedValue(undefined),
        manager: {
            save: vi.fn().mockResolvedValue({}),
            remove: vi.fn().mockResolvedValue({}),
        },
    }),
};

/**
 * Mock Migration Service
 */
export const MockMigrationService = {
    runMigrations: vi.fn().mockResolvedValue({ migrations: [] }),
    revertLastMigration: vi.fn().mockResolvedValue({ success: true }),
    getPendingMigrations: vi.fn().mockResolvedValue([]),
    getExecutedMigrations: vi.fn().mockResolvedValue([]),
};

/**
 * Create a mock entity for testing
 */
export function createMockEntity<T>(partial: Partial<T> = {}): T {
    return {
        id: 'mock-id-' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...partial,
    } as T;
}

/**
 * Create multiple mock entities
 */
export function createMockEntities<T>(count: number, partial: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => createMockEntity<T>(partial));
}
