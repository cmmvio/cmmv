"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheRegistry = void 0;
class CacheRegistry {
    static registerHandler(target, key, handlerName, options, context) {
        Reflect.defineMetadata('cache_metadata', { handler: handlerName, key, options }, context);
    }
}
exports.CacheRegistry = CacheRegistry;
