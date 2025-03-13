import { ConfigSchema } from '@cmmv/core';

export const GraphQLConfig: ConfigSchema = {
    graphql: {
        port: {
            type: 'number',
            required: false,
            default: 4000,
        },
    },
};
