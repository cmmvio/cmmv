import { vi } from 'vitest';

/**
 * Mock for CacheOptions interface
 */
export interface MockCacheOptions {
    ttl?: number;
    compress?: boolean;
    schema?: any;
}

/**
 * Mock for Cache Decorator
 */
export class MockCacheDecorator {
    public static Cache = vi
        .fn()
        .mockImplementation((key: string, options?: MockCacheOptions) => {
            return (
                target: any,
                propertyKey: string | symbol,
                context?: any,
            ) => {
                MockCacheRegistry.registerHandler(
                    target,
                    key,
                    propertyKey as string,
                    options,
                    context?.value,
                );
            };
        });

    public static createHandlerDecorator = vi
        .fn()
        .mockImplementation((key: string, options?: MockCacheOptions) => {
            return (
                target: any,
                propertyKey: string | symbol,
                context?: any,
            ) => {
                MockCacheRegistry.registerHandler(
                    target,
                    key,
                    propertyKey as string,
                    options,
                    context?.value,
                );
            };
        });

    public static reset(): void {
        MockCacheDecorator.Cache.mockReset();
        MockCacheDecorator.createHandlerDecorator.mockReset();

        MockCacheDecorator.Cache.mockImplementation(
            (key: string, options?: MockCacheOptions) => {
                return (
                    target: any,
                    propertyKey: string | symbol,
                    context?: any,
                ) => {
                    MockCacheRegistry.registerHandler(
                        target,
                        key,
                        propertyKey as string,
                        options,
                        context?.value,
                    );
                };
            },
        );

        MockCacheDecorator.createHandlerDecorator.mockImplementation(
            (key: string, options?: MockCacheOptions) => {
                return (
                    target: any,
                    propertyKey: string | symbol,
                    context?: any,
                ) => {
                    MockCacheRegistry.registerHandler(
                        target,
                        key,
                        propertyKey as string,
                        options,
                        context?.value,
                    );
                };
            },
        );
    }

    public static getMockModule() {
        return {
            CacheOptions: {},
            Cache: MockCacheDecorator.Cache,
            createHandlerDecorator: MockCacheDecorator.createHandlerDecorator,
        };
    }
}

/**
 * Mock for Cache Registry
 */
export class MockCacheRegistry {
    public static registerHandler = vi
        .fn()
        .mockImplementation(
            (
                target: any,
                key: string,
                handlerName: string,
                options?: MockCacheOptions,
                context?: any,
            ) => {
                if (context) {
                    Reflect.defineMetadata(
                        'cache_metadata',
                        { handler: handlerName, key, options },
                        context,
                    );
                }
            },
        );

    public static reset(): void {
        MockCacheRegistry.registerHandler.mockReset();
        MockCacheRegistry.registerHandler.mockImplementation(
            (
                target: any,
                key: string,
                handlerName: string,
                options?: MockCacheOptions,
                context?: any,
            ) => {
                if (context) {
                    Reflect.defineMetadata(
                        'cache_metadata',
                        { handler: handlerName, key, options },
                        context,
                    );
                }
            },
        );
    }

    public static getMockModule() {
        return {
            CacheRegistry: {
                registerHandler: MockCacheRegistry.registerHandler,
            },
        };
    }
}

/**
 * Mock for Cache Service
 */
export class MockCacheService {
    private static _instance: MockCacheService;

    public logger = {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    };
    public manager = {
        set: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue(null),
        del: vi.fn().mockResolvedValue(undefined),
    };

    public static loadConfig = vi.fn().mockResolvedValue(undefined);
    public static set = vi
        .fn()
        .mockImplementation(
            async (key: string, value: string, ttl: number = 5) => {
                try {
                    const instance = MockCacheService.getInstance();
                    await instance.manager.set(key, value, ttl * 1000);
                    return true;
                } catch (e) {
                    return false;
                }
            },
        );

    public static get = vi.fn().mockImplementation(async (key: string) => {
        try {
            const instance = MockCacheService.getInstance();
            return await instance.manager.get(key);
        } catch (e) {
            return null;
        }
    });

    public static del = vi.fn().mockImplementation(async (key: string) => {
        try {
            const instance = MockCacheService.getInstance();
            await instance.manager.del(key);
            return true;
        } catch (e) {
            return false;
        }
    });

    public static getInstance(): MockCacheService {
        if (!MockCacheService._instance) {
            MockCacheService._instance = new MockCacheService();
        }
        return MockCacheService._instance;
    }

    public static reset(): void {
        const instance = MockCacheService.getInstance();

        instance.logger.error.mockReset();
        instance.logger.info.mockReset();
        instance.logger.debug.mockReset();
        instance.logger.warn.mockReset();

        instance.manager.set.mockReset();
        instance.manager.get.mockReset();
        instance.manager.del.mockReset();

        instance.manager.set.mockResolvedValue(undefined);
        instance.manager.get.mockResolvedValue(null);
        instance.manager.del.mockResolvedValue(undefined);

        MockCacheService.loadConfig.mockReset();
        MockCacheService.set.mockReset();
        MockCacheService.get.mockReset();
        MockCacheService.del.mockReset();

        MockCacheService.loadConfig.mockResolvedValue(undefined);
        MockCacheService.set.mockImplementation(
            async (key: string, value: string, ttl: number = 5) => {
                try {
                    const instance = MockCacheService.getInstance();
                    await instance.manager.set(key, value, ttl * 1000);
                    return true;
                } catch (e) {
                    return false;
                }
            },
        );

        MockCacheService.get.mockImplementation(async (key: string) => {
            try {
                const instance = MockCacheService.getInstance();
                return await instance.manager.get(key);
            } catch (e) {
                return null;
            }
        });

        MockCacheService.del.mockImplementation(async (key: string) => {
            try {
                const instance = MockCacheService.getInstance();
                await instance.manager.del(key);
                return true;
            } catch (e) {
                return false;
            }
        });
    }

    public static getMockModule() {
        return {
            CacheService: {
                getInstance: MockCacheService.getInstance,
                loadConfig: MockCacheService.loadConfig,
                set: MockCacheService.set,
                get: MockCacheService.get,
                del: MockCacheService.del,
            },
        };
    }
}

/**
 * Mock for fnv1a hash function
 */
export class MockFnv1a {
    public static fnv1a = vi
        .fn()
        .mockImplementation((input: string | Buffer) => {
            if (input instanceof Buffer) {
                return Buffer.from(input).toString('hex').substring(0, 8);
            } else if (typeof input === 'string') {
                return input.substring(0, 8);
            } else {
                throw new Error('input must be a string or a Buffer');
            }
        });

    public static reset(): void {
        MockFnv1a.fnv1a.mockReset();
        MockFnv1a.fnv1a.mockImplementation((input: string | Buffer) => {
            if (input instanceof Buffer) {
                return Buffer.from(input).toString('hex').substring(0, 8);
            } else if (typeof input === 'string') {
                return input.substring(0, 8);
            } else {
                throw new Error('input must be a string or a Buffer');
            }
        });
    }

    public static getMockModule() {
        return {
            fnv1a: MockFnv1a.fnv1a,
        };
    }
}

/**
 * Centralized mock for all Cache components
 */
export class MockCache {
    public static CacheDecorator = MockCacheDecorator;
    public static CacheRegistry = MockCacheRegistry;
    public static CacheService = MockCacheService;
    public static Fnv1a = MockFnv1a;

    /**
     * Reset all cache mocks
     */
    public static reset(): void {
        MockCacheDecorator.reset();
        MockCacheRegistry.reset();
        MockCacheService.reset();
        MockFnv1a.reset();
    }

    /**
     * Get a complete mock of the cache module
     */
    public static getMockModule() {
        return {
            ...MockCacheDecorator.getMockModule(),
            ...MockCacheRegistry.getMockModule(),
            ...MockCacheService.getMockModule(),
            ...MockFnv1a.getMockModule(),
        };
    }
}

/**
 * Centralized mock export for cache
 */
export const mockCache = MockCache;

// Export individual components
export const Cache = MockCacheDecorator.Cache;
export const CacheRegistry = MockCacheRegistry;
export const CacheService = MockCacheService;
export const fnv1a = MockFnv1a.fnv1a;
