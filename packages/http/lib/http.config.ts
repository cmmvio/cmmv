import { ConfigSchema } from '@cmmv/core';

export const HTTPConfig: ConfigSchema = {
    server: {
        host: {
            required: true,
            type: 'string',
            default: '0.0.0.0',
        },
        port: {
            required: true,
            type: 'number',
            default: 3000,
        },
        poweredBy: {
            required: false,
            type: 'boolean',
            default: true,
        },
        removePolicyHeaders: {
            required: false,
            type: 'boolean',
            default: false,
        },
        publicDirs: {
            required: false,
            type: 'array',
        },
        render: {
            required: false,
            type: 'string',
            default: '@cmmv/view',
        },
        cors: {
            required: false,
            type: 'boolean',
            default: true,
        },
        logging: {
            required: false,
            type: 'string',
            default: 'all',
        },
        compress: {
            required: false,
            type: 'object',
            default: {},
            properties: {
                enabled: {
                    required: false,
                    type: 'boolean',
                    default: true,
                },
                options: {
                    required: false,
                    type: 'object',
                    default: {},
                },
            },
        },
        helmet: {
            required: false,
            type: 'object',
            default: {},
            properties: {
                enabled: {
                    required: false,
                    type: 'boolean',
                    default: true,
                },
                options: {
                    required: false,
                    type: 'object',
                    default: {},
                },
            },
        },
        session: {
            required: false,
            type: 'object',
            default: {},
            properties: {
                enabled: {
                    required: false,
                    type: 'boolean',
                    default: true,
                },
                options: {
                    required: false,
                    type: 'object',
                    default: {},
                    properties: {
                        sessionCookieName: {
                            required: false,
                            type: 'string',
                            default: 'cmmv-session',
                        },
                        secret: {
                            required: false,
                            type: 'string',
                            default: '',
                        },
                        resave: {
                            required: false,
                            type: 'boolean',
                            default: false,
                        },
                        saveUninitialized: {
                            required: false,
                            type: 'boolean',
                            default: false,
                        },
                        cookie: {
                            required: false,
                            type: 'object',
                            default: {},
                        },
                    },
                },
            },
        },
    },

    head: {
        title: {
            required: false,
            type: 'string',
        },
        htmlAttrs: {
            required: false,
            type: 'object',
            default: {},
            properties: {
                lang: {
                    required: false,
                    type: 'string',
                    default: 'en',
                },
            },
        },
        meta: {
            required: false,
            type: 'array',
        },
        link: {
            required: false,
            type: 'array',
        },
    },
};
