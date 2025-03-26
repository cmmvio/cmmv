"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const vitest_1 = require("vitest");
const cache_registry_1 = require("../lib/cache.registry");
(0, vitest_1.describe)('CacheRegistry', () => {
    (0, vitest_1.it)('should register cache handler metadata correctly', () => {
        class TestClass {
        }
        const context = TestClass.prototype;
        const key = 'cacheKey';
        const handlerName = 'testHandler';
        const options = { ttl: 100 };
        cache_registry_1.CacheRegistry.registerHandler(context, key, handlerName, options, context);
        const metadata = Reflect.getMetadata('cache_metadata', context);
        (0, vitest_1.expect)(metadata).toEqual({
            handler: handlerName,
            key: key,
            options: options,
        });
    });
    (0, vitest_1.it)('should register handler metadata without options', () => {
        class TestClass {
        }
        const context = TestClass.prototype;
        const key = 'cacheKey';
        const handlerName = 'testHandler';
        cache_registry_1.CacheRegistry.registerHandler(context, key, handlerName, undefined, context);
        const metadata = Reflect.getMetadata('cache_metadata', context);
        (0, vitest_1.expect)(metadata).toEqual({
            handler: handlerName,
            key: key,
            options: undefined,
        });
    });
});
