"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenReturnSchema = exports.RefreshTokenHeadersSchema = exports.CheckUsernameReturnSchema = exports.CheckUsernamePayloadSchema = exports.CheckTokenReturnSchema = exports.RegistryReturnSchema = exports.RegistryPayloadSchema = exports.LoginReturnSchema = exports.LoginPayloadSchema = void 0;
//Schemas
exports.LoginPayloadSchema = {
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    username: { type: 'string', required: true },
                    password: { type: 'string', required: true },
                    token: { type: 'string', required: false },
                    opt: { type: 'string', required: false },
                },
            },
            examples: {
                default: {
                    value: {
                        username: '',
                        password: '',
                    },
                },
                reCAPTCHA: {
                    value: {
                        username: '',
                        password: '',
                        token: '',
                    },
                },
                F2A: {
                    value: {
                        username: '',
                        password: '',
                        token: '',
                        opt: '',
                    },
                },
            },
        },
    },
};
exports.LoginReturnSchema = {
    description: 'Login response schema',
    headers: {
        'set-cookie': {
            schema: {
                type: 'string',
                description: 'Session cookie for authentication if application is enabled',
            },
        },
    },
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    status: { type: 'number' },
                    processingTime: { type: 'number' },
                    result: {
                        type: 'object',
                        properties: {
                            token: { type: 'string' },
                            refreshToken: { type: 'string' },
                        },
                    },
                },
            },
        },
    },
};
exports.RegistryPayloadSchema = {
    required: true,
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                },
            },
        },
    },
};
exports.RegistryReturnSchema = {
    description: 'Registry response schema',
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    status: { type: 'number' },
                    processingTime: { type: 'number' },
                    result: {
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                        },
                    },
                },
            },
        },
    },
};
exports.CheckTokenReturnSchema = {
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    sucess: { type: 'boolean' },
                },
            },
        },
    },
};
exports.CheckUsernamePayloadSchema = {
    required: true,
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    username: { type: 'string' },
                },
            },
        },
    },
};
exports.CheckUsernameReturnSchema = {
    content: {
        'text/plain': {
            schema: {
                type: 'boolean',
            },
        },
    },
};
exports.RefreshTokenHeadersSchema = [
    {
        in: 'header',
        name: 'authorization',
        required: true,
        schema: {
            type: 'string',
        },
    },
    {
        in: 'header',
        name: 'refreshToken',
        required: false,
        schema: {
            type: 'string',
        },
    },
    {
        in: 'cookie',
        name: 'refreshToken',
        required: false,
        schema: {
            type: 'string',
        },
    },
];
exports.RefreshTokenReturnSchema = {
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    status: { type: 'number' },
                    processingTime: { type: 'number' },
                    result: {
                        type: 'object',
                        properties: {
                            token: { type: 'string' },
                        },
                    },
                },
            },
        },
    },
};
