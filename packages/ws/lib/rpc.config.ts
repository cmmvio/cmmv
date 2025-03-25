import { ConfigSchema } from '@cmmv/core';

export const RPCConfig: ConfigSchema = {
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
