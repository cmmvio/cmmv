"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cacheManager = require("cache-manager");
const vitest_1 = require("vitest");
const cache_service_1 = require("../lib/cache.service");
(0, vitest_1.describe)('CacheService', () => {
    let sandbox;
    (0, vitest_1.beforeEach)(async () => {
        cache_service_1.CacheService.getInstance().manager = await cacheManager.caching('memory', {
            max: 100,
            ttl: 10,
        });
        sandbox = vitest_1.vi.spyOn(cache_service_1.CacheService.getInstance().manager, 'set');
    });
    (0, vitest_1.afterEach)(async () => {
        if (cache_service_1.CacheService.getInstance().manager)
            await cache_service_1.CacheService.getInstance().manager.reset();
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('should set a cache key-value pair', async () => {
        const setSpy = vitest_1.vi.spyOn(cache_service_1.CacheService.getInstance().manager, 'set');
        const result = await cache_service_1.CacheService.set('testKey', 'testValue', 10);
        (0, vitest_1.expect)(result).toBe(true);
        (0, vitest_1.expect)(setSpy).toHaveBeenCalledWith('testKey', 'testValue', 10000);
    });
    (0, vitest_1.it)('should get a cached value by key', async () => {
        const getStub = vitest_1.vi
            .spyOn(cache_service_1.CacheService.getInstance().manager, 'get')
            .mockResolvedValue('testValue');
        const result = await cache_service_1.CacheService.get('testKey');
        (0, vitest_1.expect)(result).toBe('testValue');
        (0, vitest_1.expect)(getStub).toHaveBeenCalledWith('testKey');
    });
    (0, vitest_1.it)('should return null when cache key does not exist', async () => {
        const getStub = vitest_1.vi
            .spyOn(cache_service_1.CacheService.getInstance().manager, 'get')
            .mockResolvedValue(null);
        const result = await cache_service_1.CacheService.get('nonExistentKey');
        (0, vitest_1.expect)(result).toBeNull();
        (0, vitest_1.expect)(getStub).toHaveBeenCalledWith('nonExistentKey');
    });
    (0, vitest_1.it)('should delete a cache key', async () => {
        await cache_service_1.CacheService.set('testKey', 'test');
        const result = await cache_service_1.CacheService.del('testKey');
        (0, vitest_1.expect)(result).toBe(true);
    });
    (0, vitest_1.it)('should set a cache key-value pair', async () => {
        const result = await cache_service_1.CacheService.set('testKey', 'testValue', 10);
        const cachedValue = await cache_service_1.CacheService.get('testKey');
        (0, vitest_1.expect)(result).toBe(true);
        (0, vitest_1.expect)(cachedValue).toBe('testValue');
    });
    (0, vitest_1.it)('should get a cached value by key', async () => {
        await cache_service_1.CacheService.set('testKey', 'testValue', 10);
        const result = await cache_service_1.CacheService.get('testKey');
        (0, vitest_1.expect)(result).toBe('testValue');
    });
});
