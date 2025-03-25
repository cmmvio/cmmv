import { ConfigSchema } from '@cmmv/core';

export const GraphQLConfig: ConfigSchema = {
    graphql: {
        host: {
            type: 'string',
            required: false,
            default: '0.0.0.0',
        },
        port: {
            type: 'number',
            required: false,
            default: 4000,
        },
        generateResolvers: {
            required: false,
            type: 'boolean',
            default: true,
        },
        blacklog: {
            type: 'boolean',
            required: false,
            default: false,
        },
    },
};
