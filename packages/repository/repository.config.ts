import { ConfigSchema } from '@cmmv/core';

export const RepositoryConfig: ConfigSchema = {
    repository: {
        type: {
            required: true,
            type: 'string',
            default: 'sqlite',
        },
        host: {
            required: false,
            type: 'string',
        },
        port: {
            required: false,
            type: 'number',
        },
        database: {
            required: false,
            type: 'string',
            default: './database.sqlite',
        },
        synchronize: {
            required: false,
            type: 'boolean',
            default: true,
        },
        logging: {
            required: false,
            type: 'boolean',
            default: true,
        },
        migrations: {
            required: false,
            type: 'boolean',
            default: true,
        },
        migrationsDir: {
            required: false,
            type: 'string',
            default: './src/migrations',
        },
    },
};
