"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThrottlerConfig = void 0;
exports.ThrottlerConfig = {
    throttler: {
        limit: {
            required: true,
            type: 'string',
        },
        ttl: {
            required: true,
            type: 'number',
        },
        gcInterval: {
            required: true,
            type: 'number',
        },
    },
};
