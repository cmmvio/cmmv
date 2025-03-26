"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCConfig = void 0;
exports.RPCConfig = {
    rpc: {
        enabled: {
            required: true,
            type: 'boolean',
            default: true,
        },
        preLoadContracts: {
            required: true,
            type: 'boolean',
            default: true,
        },
        injectMiddleware: {
            required: false,
            type: 'boolean',
            default: false,
        },
        generateGateways: {
            required: false,
            type: 'boolean',
            default: true,
        },
    },
};
