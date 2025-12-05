import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @cmmv/http decorators
vi.mock('@cmmv/http', () => ({
    Controller: vi.fn(() => (target: any) => target),
    Get: vi.fn(
        () =>
            (
                target: any,
                propertyKey: string,
                descriptor: PropertyDescriptor,
            ) =>
                descriptor,
    ),
    Param: vi.fn(
        () => (target: any, propertyKey: string, parameterIndex: number) => {},
    ),
}));

// Mock repository service
vi.mock('../lib/repository.service', () => ({
    Repository: {
        listDatabases: vi.fn(),
        listTables: vi.fn(),
    },
}));

import { RepositoryController } from '../lib/repository.controller';
import { Repository } from '../lib/repository.service';

describe('RepositoryController', () => {
    let controller: RepositoryController;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new RepositoryController();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('handlerListDatabase', () => {
        it('should call Repository.listDatabases', async () => {
            const mockDatabases = { databases: ['db1', 'db2', 'db3'] };
            vi.mocked(Repository.listDatabases).mockResolvedValue(
                mockDatabases,
            );

            const result = await controller.handlerListDatabase();

            expect(Repository.listDatabases).toHaveBeenCalled();
            expect(result).toEqual(mockDatabases);
        });

        it('should return empty array when no databases exist', async () => {
            const mockDatabases = { databases: [] };
            vi.mocked(Repository.listDatabases).mockResolvedValue(
                mockDatabases,
            );

            const result = await controller.handlerListDatabase();

            expect(result).toEqual(mockDatabases);
        });

        it('should throw error when Repository.listDatabases fails', async () => {
            vi.mocked(Repository.listDatabases).mockRejectedValue(
                new Error('Database connection failed'),
            );

            await expect(controller.handlerListDatabase()).rejects.toThrow(
                'Database connection failed',
            );
        });

        it('should return multiple databases', async () => {
            const mockDatabases = {
                databases: ['main', 'test', 'analytics', 'backup'],
            };
            vi.mocked(Repository.listDatabases).mockResolvedValue(
                mockDatabases,
            );

            const result = await controller.handlerListDatabase();

            expect(result.databases).toHaveLength(4);
            expect(result.databases).toContain('main');
            expect(result.databases).toContain('analytics');
        });
    });

    describe('handlerListTables', () => {
        it('should call Repository.listTables with database name', async () => {
            const mockTables = { tables: ['users', 'products', 'orders'] };
            vi.mocked(Repository.listTables).mockResolvedValue(mockTables);

            const result = await controller.handlerListTables('myDatabase');

            expect(Repository.listTables).toHaveBeenCalledWith('myDatabase');
            expect(result).toEqual(mockTables);
        });

        it('should return empty array when database has no tables', async () => {
            const mockTables = { tables: [] };
            vi.mocked(Repository.listTables).mockResolvedValue(mockTables);

            const result = await controller.handlerListTables('emptyDatabase');

            expect(Repository.listTables).toHaveBeenCalledWith('emptyDatabase');
            expect(result).toEqual(mockTables);
        });

        it('should throw error when database does not exist', async () => {
            vi.mocked(Repository.listTables).mockRejectedValue(
                new Error('Database not found'),
            );

            await expect(
                controller.handlerListTables('nonExistent'),
            ).rejects.toThrow('Database not found');
        });

        it('should handle special characters in database name', async () => {
            const mockTables = { tables: ['table1'] };
            vi.mocked(Repository.listTables).mockResolvedValue(mockTables);

            const result =
                await controller.handlerListTables('my-database_123');

            expect(Repository.listTables).toHaveBeenCalledWith(
                'my-database_123',
            );
            expect(result).toEqual(mockTables);
        });

        it('should return multiple tables', async () => {
            const mockTables = {
                tables: [
                    'users',
                    'products',
                    'orders',
                    'categories',
                    'reviews',
                ],
            };
            vi.mocked(Repository.listTables).mockResolvedValue(mockTables);

            const result = await controller.handlerListTables('ecommerce');

            expect(result.tables).toHaveLength(5);
            expect(result.tables).toContain('users');
            expect(result.tables).toContain('orders');
        });
    });

    describe('error handling', () => {
        it('should propagate errors from listDatabases', async () => {
            const error = new Error('Connection timeout');
            vi.mocked(Repository.listDatabases).mockRejectedValue(error);

            await expect(controller.handlerListDatabase()).rejects.toThrow(
                'Connection timeout',
            );
        });

        it('should propagate errors from listTables', async () => {
            const error = new Error('Permission denied');
            vi.mocked(Repository.listTables).mockRejectedValue(error);

            await expect(
                controller.handlerListTables('restrictedDb'),
            ).rejects.toThrow('Permission denied');
        });

        it('should handle database access errors', async () => {
            vi.mocked(Repository.listTables).mockRejectedValue(
                new Error('Access denied for user'),
            );

            await expect(
                controller.handlerListTables('securedDb'),
            ).rejects.toThrow('Access denied for user');
        });

        it('should handle network errors', async () => {
            vi.mocked(Repository.listDatabases).mockRejectedValue(
                new Error('Network unreachable'),
            );

            await expect(controller.handlerListDatabase()).rejects.toThrow(
                'Network unreachable',
            );
        });
    });
});
