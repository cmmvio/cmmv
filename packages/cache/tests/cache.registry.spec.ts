import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { CacheRegistry } from '../lib/cache.registry';

describe('CacheRegistry', () => {
    it('should register cache handler metadata correctly', () => {
        class TestClass {}
        const context = TestClass.prototype;
        const key = 'cacheKey';
        const handlerName = 'testHandler';
        const options = { ttl: 100 };

        CacheRegistry.registerHandler(
            context,
            key,
            handlerName,
            options,
            context,
        );

        const metadata = Reflect.getMetadata('cache_metadata', context);

        expect(metadata).toEqual({
            handler: handlerName,
            key: key,
            options: options,
        });
    });

    it('should register handler metadata without options', () => {
        class TestClass {}
        const context = TestClass.prototype;
        const key = 'cacheKey';
        const handlerName = 'testHandler';

        CacheRegistry.registerHandler(
            context,
            key,
            handlerName,
            undefined,
            context,
        );

        const metadata = Reflect.getMetadata('cache_metadata', context);

        expect(metadata).toEqual({
            handler: handlerName,
            key: key,
            options: undefined,
        });
    });
});
