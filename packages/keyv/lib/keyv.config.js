"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyvConfig = void 0;
exports.KeyvConfig = {
    keyv: {
        uri: {
            required: true,
            type: 'string',
            default: '',
        },
        options: {
            required: false,
            type: 'object',
            default: {},
            properties: {
                namespace: {
                    required: false,
                    type: 'string',
                    default: 'keyv',
                },
                ttl: {
                    required: false,
                    type: 'number',
                },
                compression: {
                    required: false,
                    type: 'any',
                },
                serialize: {
                    required: false,
                    type: 'function',
                },
                deserialize: {
                    required: false,
                    type: 'function',
                },
                store: {
                    required: false,
                    type: 'any',
                },
                adapter: {
                    required: false,
                    type: 'string',
                },
            },
        },
    },
};
