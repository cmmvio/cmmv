"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPIConfig = void 0;
exports.OpenAPIConfig = {
    openapi: {
        openapi: {
            type: 'string',
            required: false,
            default: '3.0.4',
        },
        info: {
            type: 'object',
            required: false,
            properties: {
                title: {
                    type: 'string',
                    required: false,
                },
                version: {
                    type: 'string',
                    required: false,
                },
                termsOfService: {
                    type: 'string',
                    required: false,
                },
                contact: {
                    type: 'object',
                    required: false,
                    properties: {
                        name: {
                            type: 'string',
                            required: false,
                        },
                        email: {
                            type: 'string',
                            required: false,
                        },
                        url: {
                            type: 'string',
                            required: false,
                        },
                    },
                },
                license: {
                    type: 'object',
                    required: false,
                    properties: {
                        name: {
                            type: 'string',
                            required: false,
                        },
                        url: {
                            type: 'string',
                            required: false,
                        },
                    },
                },
            },
        },
        externalDocs: {
            type: 'object',
            required: false,
            properties: {
                description: {
                    type: 'string',
                    required: false,
                },
                url: {
                    type: 'string',
                    required: false,
                },
            },
        },
        servers: {
            type: 'array',
            required: false,
            properties: {
                url: {
                    type: 'string',
                    required: false,
                },
                description: {
                    type: 'string',
                    required: false,
                },
                variables: {
                    type: 'object',
                    required: false,
                },
            },
            default: [{ url: 'http://localhost:3000' }],
        },
    },
};
