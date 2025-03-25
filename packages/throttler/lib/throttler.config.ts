import { ConfigSchema } from '@cmmv/core';

export const ThrottlerConfig: ConfigSchema = {
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
