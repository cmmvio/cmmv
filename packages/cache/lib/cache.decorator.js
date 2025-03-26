"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = Cache;
const cache_registry_1 = require("./cache.registry");
function createHandlerDecorator(key, options) {
    return (target, propertyKey, context) => {
        cache_registry_1.CacheRegistry.registerHandler(target, key, propertyKey, options, context.value);
    };
}
function Cache(key, options) {
    return createHandlerDecorator(key, options);
}
