import * as cacheManager from 'cache-manager';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService } from '../lib/cache.service';

describe('CacheService', () => {
    let sandbox: any;

    beforeEach(async () => {
        CacheService.getInstance().manager = await cacheManager.caching(
            'memory',
            {
                max: 100,
                ttl: 10,
            },
        );

        sandbox = vi.spyOn(CacheService.getInstance().manager, 'set');
    });

    afterEach(async () => {
        if (CacheService.getInstance().manager)
            await CacheService.getInstance().manager.reset();

        vi.restoreAllMocks();
    });

    it('should set a cache key-value pair', async () => {
        const setSpy = vi.spyOn(CacheService.getInstance().manager, 'set');
        const result = await CacheService.set('testKey', 'testValue', 10);
        expect(result).toBe(true);
        expect(setSpy).toHaveBeenCalledWith('testKey', 'testValue', 10000);
    });

    it('should get a cached value by key', async () => {
        const getStub = vi
            .spyOn(CacheService.getInstance().manager, 'get')
            .mockResolvedValue('testValue');

        const result = await CacheService.get('testKey');
        expect(result).toBe('testValue');
        expect(getStub).toHaveBeenCalledWith('testKey');
    });

    it('should return null when cache key does not exist', async () => {
        const getStub = vi
            .spyOn(CacheService.getInstance().manager, 'get')
            .mockResolvedValue(null);

        const result = await CacheService.get('nonExistentKey');
        expect(result).toBeNull();
        expect(getStub).toHaveBeenCalledWith('nonExistentKey');
    });

    it('should delete a cache key', async () => {
        await CacheService.set('testKey', 'test');
        const result = await CacheService.del('testKey');
        expect(result).toBe(true);
    });

    it('should set a cache key-value pair', async () => {
        const result = await CacheService.set('testKey', 'testValue', 10);
        const cachedValue = await CacheService.get('testKey');

        expect(result).toBe(true);
        expect(cachedValue).toBe('testValue');
    });

    it('should get a cached value by key', async () => {
        await CacheService.set('testKey', 'testValue', 10);
        const result = await CacheService.get('testKey');

        expect(result).toBe('testValue');
    });
});
