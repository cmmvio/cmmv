import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'reflect-metadata';

// Mock cache-manager
vi.mock('cache-manager', () => ({
    caching: vi.fn().mockResolvedValue({
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
    }),
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Application: {
        setHTTPInterceptor: vi.fn(),
        setHTTPAfterRender: vi.fn(),
    },
    Config: {
        get: vi.fn().mockReturnValue({
            store: 'cache-manager-memory-store',
            ttl: 300,
        }),
    },
    Logger: class MockLogger {
        constructor(public name: string) {}
        log(...args: any[]) {}
        error(...args: any[]) {}
    },
    Scope: {
        get: vi.fn(),
    },
    Service: () => (target: any) => target,
    Singleton: class Singleton {
        private static instances = new Map();
        public static getInstance<T>(this: new () => T): T {
            if (!Singleton.instances.has(this)) {
                Singleton.instances.set(this, new this());
            }
            return Singleton.instances.get(this) as T;
        }
        public static clearInstance(): void {
            Singleton.instances.clear();
        }
    },
    isJSON: vi.fn((str: string) => {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }),
}));

import { CacheService } from '../../lib/cache.service';

describe('CacheService', () => {
    let mockManager: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset singleton
        (CacheService as any).instances = new Map();

        // Create mock manager
        mockManager = {
            get: vi.fn(),
            set: vi.fn().mockResolvedValue(undefined),
            del: vi.fn().mockResolvedValue(undefined),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getInstance', () => {
        it('should return singleton instance', () => {
            const instance1 = CacheService.getInstance();
            const instance2 = CacheService.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should have logger initialized', () => {
            const instance = CacheService.getInstance();

            expect(instance.logger).toBeDefined();
            expect(instance.logger.name).toBe('CacheService');
        });
    });

    describe('set', () => {
        it('should set value in cache', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            const result = await CacheService.set('testKey', 'testValue', 10);

            expect(result).toBe(true);
            expect(mockManager.set).toHaveBeenCalledWith(
                'testKey',
                'testValue',
                10000,
            );
        });

        it('should use default TTL of 5 seconds', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            await CacheService.set('testKey', 'testValue');

            expect(mockManager.set).toHaveBeenCalledWith(
                'testKey',
                'testValue',
                5000,
            );
        });

        it('should return false on error', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                set: vi.fn().mockRejectedValue(new Error('Set error')),
            };

            const result = await CacheService.set('testKey', 'testValue');

            expect(result).toBe(false);
        });

        it('should handle empty string value', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            const result = await CacheService.set('testKey', '');

            expect(result).toBe(true);
            expect(mockManager.set).toHaveBeenCalledWith('testKey', '', 5000);
        });

        it('should handle JSON string value', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            const jsonValue = JSON.stringify({ data: 'test' });
            const result = await CacheService.set('testKey', jsonValue);

            expect(result).toBe(true);
            expect(mockManager.set).toHaveBeenCalledWith(
                'testKey',
                jsonValue,
                5000,
            );
        });

        it('should convert TTL to milliseconds', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            await CacheService.set('testKey', 'value', 60);

            expect(mockManager.set).toHaveBeenCalledWith(
                'testKey',
                'value',
                60000,
            );
        });

        it('should handle zero TTL', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            await CacheService.set('testKey', 'value', 0);

            expect(mockManager.set).toHaveBeenCalledWith('testKey', 'value', 0);
        });
    });

    describe('get', () => {
        it('should get value from cache', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                get: vi.fn().mockResolvedValue('cachedValue'),
            };

            const result = await CacheService.get('testKey');

            expect(result).toBe('cachedValue');
        });

        it('should return null on error', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                get: vi.fn().mockRejectedValue(new Error('Get error')),
            };

            const result = await CacheService.get('testKey');

            expect(result).toBeNull();
        });

        it('should return null for non-existent key', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                get: vi.fn().mockResolvedValue(null),
            };

            const result = await CacheService.get('nonExistentKey');

            expect(result).toBeNull();
        });

        it('should return undefined when value is undefined', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                get: vi.fn().mockResolvedValue(undefined),
            };

            const result = await CacheService.get('testKey');

            expect(result).toBeUndefined();
        });

        it('should return JSON string from cache', async () => {
            const instance = CacheService.getInstance();
            const jsonValue = JSON.stringify({ data: 'test' });
            instance.manager = {
                ...mockManager,
                get: vi.fn().mockResolvedValue(jsonValue),
            };

            const result = await CacheService.get('testKey');

            expect(result).toBe(jsonValue);
        });

        it('should call manager.get with correct key', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                get: vi.fn().mockResolvedValue('value'),
            };

            await CacheService.get('myKey');

            expect(instance.manager.get).toHaveBeenCalledWith('myKey');
        });
    });

    describe('del', () => {
        it('should delete value from cache', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            const result = await CacheService.del('testKey');

            expect(result).toBe(true);
            expect(mockManager.del).toHaveBeenCalledWith('testKey');
        });

        it('should return null on error', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                del: vi.fn().mockRejectedValue(new Error('Del error')),
            };

            const result = await CacheService.del('testKey');

            expect(result).toBeNull();
        });

        it('should call manager.del with correct key', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            await CacheService.del('keyToDelete');

            expect(mockManager.del).toHaveBeenCalledWith('keyToDelete');
        });
    });

    describe('cache key variations', () => {
        it('should handle special characters in cache key', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            await CacheService.set('key:with:colons', 'value');

            expect(mockManager.set).toHaveBeenCalledWith(
                'key:with:colons',
                'value',
                5000,
            );
        });

        it('should handle numeric cache keys', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            await CacheService.set('12345', 'value');

            expect(mockManager.set).toHaveBeenCalledWith('12345', 'value', 5000);
        });

        it('should handle empty cache key', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            await CacheService.set('', 'value');

            expect(mockManager.set).toHaveBeenCalledWith('', 'value', 5000);
        });

        it('should handle long cache keys', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            const longKey = 'k'.repeat(1000);
            await CacheService.set(longKey, 'value');

            expect(mockManager.set).toHaveBeenCalledWith(longKey, 'value', 5000);
        });

        it('should handle unicode in cache key', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            await CacheService.set('key-你好', 'value');

            expect(mockManager.set).toHaveBeenCalledWith(
                'key-你好',
                'value',
                5000,
            );
        });
    });

    describe('cache value variations', () => {
        it('should handle object serialized as JSON', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            const value = JSON.stringify({ nested: { data: 'test' } });
            await CacheService.set('key', value);

            expect(mockManager.set).toHaveBeenCalledWith('key', value, 5000);
        });

        it('should handle array serialized as JSON', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            const value = JSON.stringify([1, 2, 3]);
            await CacheService.set('key', value);

            expect(mockManager.set).toHaveBeenCalledWith('key', value, 5000);
        });

        it('should handle long values', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            const longValue = 'v'.repeat(10000);
            await CacheService.set('key', longValue);

            expect(mockManager.set).toHaveBeenCalledWith(
                'key',
                longValue,
                5000,
            );
        });

        it('should handle unicode values', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            await CacheService.set('key', '你好世界');

            expect(mockManager.set).toHaveBeenCalledWith(
                'key',
                '你好世界',
                5000,
            );
        });
    });

    describe('concurrent operations', () => {
        it('should handle concurrent set operations', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            const promises = [
                CacheService.set('key1', 'value1'),
                CacheService.set('key2', 'value2'),
                CacheService.set('key3', 'value3'),
            ];

            const results = await Promise.all(promises);

            expect(results).toEqual([true, true, true]);
            expect(mockManager.set).toHaveBeenCalledTimes(3);
        });

        it('should handle concurrent get operations', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                get: vi.fn().mockImplementation((key: string) => {
                    return Promise.resolve(`value-${key}`);
                }),
            };

            const promises = [
                CacheService.get('key1'),
                CacheService.get('key2'),
                CacheService.get('key3'),
            ];

            const results = await Promise.all(promises);

            expect(results).toEqual(['value-key1', 'value-key2', 'value-key3']);
        });

        it('should handle concurrent del operations', async () => {
            const instance = CacheService.getInstance();
            instance.manager = mockManager;

            const promises = [
                CacheService.del('key1'),
                CacheService.del('key2'),
                CacheService.del('key3'),
            ];

            const results = await Promise.all(promises);

            expect(results).toEqual([true, true, true]);
            expect(mockManager.del).toHaveBeenCalledTimes(3);
        });

        it('should handle mixed concurrent operations', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                get: vi.fn().mockResolvedValue('cached'),
            };

            const promises = [
                CacheService.set('key1', 'value1'),
                CacheService.get('key2'),
                CacheService.del('key3'),
            ];

            const results = await Promise.all(promises);

            expect(results[0]).toBe(true);
            expect(results[1]).toBe('cached');
            expect(results[2]).toBe(true);
        });
    });

    describe('error recovery', () => {
        it('should continue working after set error', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                set: vi
                    .fn()
                    .mockRejectedValueOnce(new Error('Error'))
                    .mockResolvedValueOnce(undefined),
            };

            const result1 = await CacheService.set('key1', 'value1');
            const result2 = await CacheService.set('key2', 'value2');

            expect(result1).toBe(false);
            expect(result2).toBe(true);
        });

        it('should continue working after get error', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                get: vi
                    .fn()
                    .mockRejectedValueOnce(new Error('Error'))
                    .mockResolvedValueOnce('value'),
            };

            const result1 = await CacheService.get('key1');
            const result2 = await CacheService.get('key2');

            expect(result1).toBeNull();
            expect(result2).toBe('value');
        });

        it('should continue working after del error', async () => {
            const instance = CacheService.getInstance();
            instance.manager = {
                ...mockManager,
                del: vi
                    .fn()
                    .mockRejectedValueOnce(new Error('Error'))
                    .mockResolvedValueOnce(undefined),
            };

            const result1 = await CacheService.del('key1');
            const result2 = await CacheService.del('key2');

            expect(result1).toBeNull();
            expect(result2).toBe(true);
        });
    });
});
