import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('keyv', () => ({
    default: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue('cached-value'),
        delete: vi.fn().mockResolvedValue(true),
        clear: vi.fn().mockResolvedValue(undefined),
    })),
}));

vi.mock('@keyv/compress-gzip', () => ({
    default: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Application: {},
        Config: {
            get: vi.fn().mockReturnValue({
                uri: 'redis://localhost:6379',
                options: {},
            }),
        },
        Logger: vi.fn().mockImplementation(() => ({
            log: vi.fn(),
            error: vi.fn(),
        })),
        Service: () => (target: any) => target,
        Singleton: class {
            private static _instance: any;
            public static getInstance() {
                if (!this._instance) {
                    this._instance = new (this as any)();
                }
                return this._instance;
            }
        },
    };
});

import { KeyvService } from '../lib/keyv.service';
import Keyv from 'keyv';

describe('KeyvService', () => {
    let mockManager: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockManager = {
            set: vi.fn().mockResolvedValue(true),
            get: vi.fn().mockResolvedValue('cached-value'),
            delete: vi.fn().mockResolvedValue(true),
            clear: vi.fn().mockResolvedValue(undefined),
        };

        // Setup instance with mock manager
        const instance = KeyvService.getInstance();
        instance.manager = mockManager;
    });

    describe('loadConfig', () => {
        it('should initialize Keyv with config', async () => {
            await KeyvService.loadConfig({} as any);

            expect(Keyv).toHaveBeenCalled();
        });

        it('should handle initialization errors', async () => {
            vi.mocked(Keyv).mockImplementationOnce(() => {
                throw new Error('Connection failed');
            });

            const consoleSpy = vi
                .spyOn(console, 'log')
                .mockImplementation(() => {});

            await KeyvService.loadConfig({} as any);

            consoleSpy.mockRestore();
        });
    });

    describe('set', () => {
        it('should set a value with TTL', async () => {
            const result = await KeyvService.set('test-key', 'test-value', 10);

            expect(result).toBe(true);
            expect(mockManager.set).toHaveBeenCalledWith(
                'test-key',
                'test-value',
                10000,
            );
        });

        it('should use default TTL of 5 seconds', async () => {
            await KeyvService.set('test-key', 'test-value');

            expect(mockManager.set).toHaveBeenCalledWith(
                'test-key',
                'test-value',
                5000,
            );
        });

        it('should return false on error', async () => {
            mockManager.set.mockRejectedValueOnce(new Error('Set failed'));

            const result = await KeyvService.set('test-key', 'test-value');

            expect(result).toBe(false);
        });
    });

    describe('get', () => {
        it('should get a cached value', async () => {
            const result = await KeyvService.get('test-key');

            expect(result).toBe('cached-value');
            expect(mockManager.get).toHaveBeenCalledWith('test-key');
        });

        it('should return null on error', async () => {
            mockManager.get.mockRejectedValueOnce(new Error('Get failed'));

            const result = await KeyvService.get('test-key');

            expect(result).toBeNull();
        });
    });

    describe('delete', () => {
        it('should delete a key', async () => {
            const result = await KeyvService.delete('test-key');

            expect(result).toBe(true);
            expect(mockManager.delete).toHaveBeenCalledWith('test-key');
        });

        it('should return false on error', async () => {
            mockManager.delete.mockRejectedValueOnce(
                new Error('Delete failed'),
            );

            const result = await KeyvService.delete('test-key');

            expect(result).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear all keys', async () => {
            const result = await KeyvService.clear();

            expect(result).toBe(true);
            expect(mockManager.clear).toHaveBeenCalled();
        });

        it('should return false on error', async () => {
            mockManager.clear.mockRejectedValueOnce(new Error('Clear failed'));

            const result = await KeyvService.clear();

            expect(result).toBe(false);
        });
    });
});
