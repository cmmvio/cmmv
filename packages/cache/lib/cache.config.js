"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheConfig = void 0;
exports.CacheConfig = {
    cache: {
        store: {
            required: true,
            type: 'string',
            default: '@tirke/node-cache-manager-ioredis',
        },
        getter: {
            required: false,
            type: 'string',
            default: 'ioRedisStore',
        },
        host: {
            required: false,
            type: 'string',
            default: 'localhost',
        },
        port: {
            required: false,
            type: 'number',
            default: 6379,
        },
        ttl: {
            required: false,
            type: 'number',
            default: 600,
        },
    },
};
