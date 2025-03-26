"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryConfig = void 0;
exports.RepositoryConfig = {
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
