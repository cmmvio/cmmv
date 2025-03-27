import { ConfigSchema } from '@cmmv/core';

export const EmailConfig: ConfigSchema = {
    email: {
        name: {
            type: 'string',
            required: false,
        },
        host: {
            type: 'string',
            required: false,
        },
        port: {
            type: 'number',
            required: false,
        },
        secure: {
            type: 'boolean',
            required: false,
            default: false,
        },
        ignoreTLS: {
            type: 'boolean',
            required: false,
            default: false,
        },
        requireTLS: {
            type: 'boolean',
            required: false,
        },
        localAddress: {
            type: 'string',
            required: false,
        },
        connectionTimeout: {
            type: 'number',
            required: false,
        },
        greetingTimeout: {
            type: 'number',
            required: false,
        },
        socketTimeout: {
            type: 'number',
            required: false,
        },
        dnsTimeout: {
            type: 'number',
            required: false,
        },
        logger: {
            type: 'boolean',
            required: false,
            default: false,
        },
        debug: {
            type: 'boolean',
            required: false,
            default: false,
        },
        disableFileAccess: {
            type: 'boolean',
            required: false,
        },
        disableUrlAccess: {
            type: 'boolean',
            required: false,
        },
        proxy: {
            type: 'string',
            required: false,
        },
        auth: {
            type: 'object',
            required: false,
            properties: {
                type: {
                    type: 'string',
                    required: false,
                    default: 'oauth2',
                },
                user: {
                    type: 'string',
                    required: false,
                },
                pass: {
                    type: 'string',
                    required: false,
                },
                options: {
                    type: 'object',
                    required: false,
                },
                clientId: {
                    type: 'string',
                    required: false,
                },
                clientSecret: {
                    type: 'string',
                    required: false,
                },
                refreshToken: {
                    type: 'string',
                    required: false,
                },
                accessToken: {
                    type: 'string',
                    required: false,
                },
                expires: {
                    type: 'number',
                    required: false,
                },
                accessUrl: {
                    type: 'string',
                    required: false,
                },
                serviceClient: {
                    type: 'string',
                    required: false,
                },
                privateKey: {
                    type: 'string',
                    required: false,
                },
            },
        },
        tls: {
            type: 'object',
            required: false,
            properties: {
                servername: {
                    type: 'string',
                    required: false,
                },
                enableTrace: {
                    type: 'boolean',
                    required: false,
                },
                rejectUnauthorized: {
                    type: 'boolean',
                    required: false,
                },
                isServer: {
                    type: 'boolean',
                    required: false,
                },
                ALPNProtocols: {
                    type: 'boolean',
                    required: false,
                },
                SNICallback: {
                    type: 'boolean',
                    required: false,
                },
                session: {
                    type: 'any',
                    required: false,
                },
                requestOCSP: {
                    type: 'boolean',
                    required: false,
                },
            },
        },
        SES: {
            type: 'object',
            required: false,
            properties: {
                region: {
                    type: 'string',
                    required: false,
                },
                accessKeyId: {
                    type: 'string',
                    required: false,
                },
                secretAccessKey: {
                    type: 'string',
                    required: false,
                },
            },
        },
        pool: {
            type: 'boolean',
            required: false,
        },
        maxConnections: {
            type: 'number',
            required: false,
            default: 5,
        },
        maxMessages: {
            type: 'number',
            required: false,
            default: 100,
        },
    },
};
