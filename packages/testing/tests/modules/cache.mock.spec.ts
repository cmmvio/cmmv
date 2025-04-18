import { describe, it, expect, beforeEach, vi, afterAll } from 'vitest';
import {
    mockCache,
    MockCache,
    MockCacheDecorator,
    MockCacheRegistry,
    MockCacheService,
    MockFnv1a,
    Cache,
    CacheRegistry,
    CacheService,
    fnv1a,
} from '../../modules/cache.mock';

const originalDefineMetadata = Reflect.defineMetadata;
Reflect.defineMetadata = vi.fn();

describe('Cache Mocks', () => {
    beforeEach(() => {
        MockCache.reset();
        vi.clearAllMocks();
        (Reflect.defineMetadata as any).mockClear();
    });

    afterAll(() => {
        Reflect.defineMetadata = originalDefineMetadata;
    });

    describe('MockCacheDecorator', () => {
        it('should provide Cache decorator function', () => {
            expect(MockCacheDecorator.Cache).toBeDefined();
            expect(typeof MockCacheDecorator.Cache).toBe('function');
        });

        it('should return a decorator function when called', () => {
            const decorator = MockCacheDecorator.Cache('test-key');
            expect(typeof decorator).toBe('function');
        });

        it('should call registerHandler when decorator is applied', () => {
            const spy = vi.spyOn(MockCacheRegistry, 'registerHandler');
            const decorator = MockCacheDecorator.Cache('test-key', { ttl: 60 });

            const target = {};
            const propertyKey = 'testMethod';
            const context = { value: function () {} };

            decorator(target, propertyKey, context);

            expect(spy).toHaveBeenCalledWith(
                target,
                'test-key',
                'testMethod',
                { ttl: 60 },
                context.value,
            );
        });

        it('should reset mock implementation', () => {
            MockCacheDecorator.Cache.mockImplementation(() => () => {});
            expect(MockCacheDecorator.Cache('key')).toBeDefined();

            MockCacheDecorator.reset();

            const decorator = MockCacheDecorator.Cache('test-key');
            const target = {};
            decorator(target, 'method', { value: {} });

            expect(MockCacheRegistry.registerHandler).toHaveBeenCalled();
        });

        it('should provide mock module with required components', () => {
            const mockModule = MockCacheDecorator.getMockModule();

            expect(mockModule).toHaveProperty('CacheOptions');
            expect(mockModule).toHaveProperty('Cache');
            expect(mockModule).toHaveProperty('createHandlerDecorator');
        });
    });

    describe('MockCacheRegistry', () => {
        it('should provide registerHandler function', () => {
            expect(MockCacheRegistry.registerHandler).toBeDefined();
            expect(typeof MockCacheRegistry.registerHandler).toBe('function');
        });

        it('should call Reflect.defineMetadata when registerHandler is called with context', () => {
            const target = {};
            const key = 'test-key';
            const handlerName = 'testHandler';
            const options = { ttl: 60 };
            const context = {};

            MockCacheRegistry.registerHandler(
                target,
                key,
                handlerName,
                options,
                context,
            );

            expect(Reflect.defineMetadata).toHaveBeenCalledWith(
                'cache_metadata',
                { handler: handlerName, key, options },
                context,
            );
        });

        it('should not call Reflect.defineMetadata when context is undefined', () => {
            const target = {};
            const key = 'test-key';
            const handlerName = 'testHandler';

            // Limpar chamadas anteriores
            (Reflect.defineMetadata as any).mockClear();

            MockCacheRegistry.registerHandler(target, key, handlerName);

            expect(Reflect.defineMetadata).not.toHaveBeenCalled();
        });

        it('should reset mock implementation', () => {
            // Implementação personalizada que não chama Reflect.defineMetadata
            MockCacheRegistry.registerHandler.mockImplementation(() => {});

            // Limpar chamadas anteriores
            (Reflect.defineMetadata as any).mockClear();

            MockCacheRegistry.registerHandler({}, 'key', 'handler');
            expect(Reflect.defineMetadata).not.toHaveBeenCalled();

            MockCacheRegistry.reset();

            const context = {};
            MockCacheRegistry.registerHandler(
                {},
                'key',
                'handler',
                {},
                context,
            );
            expect(Reflect.defineMetadata).toHaveBeenCalled();
        });

        it('should provide mock module with CacheRegistry', () => {
            const mockModule = MockCacheRegistry.getMockModule();

            expect(mockModule).toHaveProperty('CacheRegistry');
            expect(mockModule.CacheRegistry).toHaveProperty('registerHandler');
        });
    });

    describe('MockCacheService', () => {
        it('should provide singleton instance', () => {
            const instance1 = MockCacheService.getInstance();
            const instance2 = MockCacheService.getInstance();

            expect(instance1).toBe(instance2);
            expect(instance1.logger).toBeDefined();
            expect(instance1.manager).toBeDefined();
        });

        it('should provide static methods for cache operations', () => {
            expect(MockCacheService.loadConfig).toBeDefined();
            expect(MockCacheService.set).toBeDefined();
            expect(MockCacheService.get).toBeDefined();
            expect(MockCacheService.del).toBeDefined();
        });

        it('should set values in cache', async () => {
            const instance = MockCacheService.getInstance();
            const spy = vi.spyOn(instance.manager, 'set');

            const result = await MockCacheService.set(
                'test-key',
                'test-value',
                10,
            );

            expect(result).toBe(true);
            expect(spy).toHaveBeenCalledWith(
                'test-key',
                'test-value',
                10 * 1000,
            );
        });

        it('should get values from cache', async () => {
            const instance = MockCacheService.getInstance();
            instance.manager.get.mockResolvedValueOnce('cached-value');

            const result = await MockCacheService.get('test-key');

            expect(result).toBe('cached-value');
            expect(instance.manager.get).toHaveBeenCalledWith('test-key');
        });

        it('should delete values from cache', async () => {
            const instance = MockCacheService.getInstance();
            const spy = vi.spyOn(instance.manager, 'del');

            const result = await MockCacheService.del('test-key');

            expect(result).toBe(true);
            expect(spy).toHaveBeenCalledWith('test-key');
        });

        it('should reset all mock implementations', () => {
            const instance = MockCacheService.getInstance();

            // Change some implementations
            instance.logger.error.mockImplementation(() => 'error');
            instance.manager.get.mockResolvedValue('custom');
            MockCacheService.set.mockResolvedValue(false);

            // Verify changes
            expect(instance.logger.error()).toBe('error');

            // Reset
            MockCacheService.reset();

            // Verify reset
            expect(instance.logger.error()).toBeUndefined();
            expect(MockCacheService.set('key', 'value')).resolves.toBe(true);
        });

        it('should provide mock module with CacheService', () => {
            const mockModule = MockCacheService.getMockModule();

            expect(mockModule).toHaveProperty('CacheService');
            expect(mockModule.CacheService).toHaveProperty('getInstance');
            expect(mockModule.CacheService).toHaveProperty('loadConfig');
            expect(mockModule.CacheService).toHaveProperty('set');
            expect(mockModule.CacheService).toHaveProperty('get');
            expect(mockModule.CacheService).toHaveProperty('del');
        });
    });

    describe('MockFnv1a', () => {
        it('should provide fnv1a hash function', () => {
            expect(MockFnv1a.fnv1a).toBeDefined();
            expect(typeof MockFnv1a.fnv1a).toBe('function');
        });

        it('should handle string input', () => {
            const result = MockFnv1a.fnv1a('test-input');
            expect(result).toBe('test-inp');
        });

        it('should handle Buffer input', () => {
            const buffer = Buffer.from('test-buffer');
            const result = MockFnv1a.fnv1a(buffer);
            expect(typeof result).toBe('string');
        });

        it('should throw error for invalid input', () => {
            expect(() => MockFnv1a.fnv1a(123 as any)).toThrow(
                'input must be a string or a Buffer',
            );
        });

        it('should reset mock implementation', () => {
            MockFnv1a.fnv1a.mockImplementation(() => 'fixed-hash');
            expect(MockFnv1a.fnv1a('any')).toBe('fixed-hash');

            MockFnv1a.reset();

            expect(MockFnv1a.fnv1a('test')).toBe('test');
        });

        it('should provide mock module with fnv1a', () => {
            const mockModule = MockFnv1a.getMockModule();

            expect(mockModule).toHaveProperty('fnv1a');
            expect(mockModule.fnv1a).toBe(MockFnv1a.fnv1a);
        });
    });

    describe('MockCache (Central)', () => {
        it('should provide access to all component mocks', () => {
            expect(MockCache.CacheDecorator).toBe(MockCacheDecorator);
            expect(MockCache.CacheRegistry).toBe(MockCacheRegistry);
            expect(MockCache.CacheService).toBe(MockCacheService);
            expect(MockCache.Fnv1a).toBe(MockFnv1a);
        });

        it('should reset all component mocks', () => {
            const spyCacheDecorator = vi.spyOn(MockCacheDecorator, 'reset');
            const spyCacheRegistry = vi.spyOn(MockCacheRegistry, 'reset');
            const spyCacheService = vi.spyOn(MockCacheService, 'reset');
            const spyFnv1a = vi.spyOn(MockFnv1a, 'reset');

            MockCache.reset();

            expect(spyCacheDecorator).toHaveBeenCalled();
            expect(spyCacheRegistry).toHaveBeenCalled();
            expect(spyCacheService).toHaveBeenCalled();
            expect(spyFnv1a).toHaveBeenCalled();
        });

        it('should provide complete mock module with all components', () => {
            const mockModule = MockCache.getMockModule();

            // Check for decorator components
            expect(mockModule).toHaveProperty('Cache');
            expect(mockModule).toHaveProperty('CacheOptions');

            // Check for registry components
            expect(mockModule).toHaveProperty('CacheRegistry');

            // Check for service components
            expect(mockModule).toHaveProperty('CacheService');

            // Check for fnv1a components
            expect(mockModule).toHaveProperty('fnv1a');
        });
    });

    describe('Individual exports', () => {
        it('should export Cache decorator', () => {
            expect(Cache).toBe(MockCacheDecorator.Cache);
        });

        it('should export CacheRegistry', () => {
            expect(CacheRegistry).toBe(MockCacheRegistry);
        });

        it('should export CacheService', () => {
            expect(CacheService).toBe(MockCacheService);
        });

        it('should export fnv1a function', () => {
            expect(fnv1a).toBe(MockFnv1a.fnv1a);
        });

        it('should export mockCache', () => {
            expect(mockCache).toBe(MockCache);
        });
    });
});
