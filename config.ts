import * as dotenv from 'dotenv';

dotenv.config();

export default {
    env: process.env.NODE_ENV,

    app: {
        telemetry: false,
    },

    server: {
        host: process.env.HOST || '0.0.0.0',
        port: process.env.PORT || 3000,
        poweredBy: false,
        removePolicyHeaders: false,
        publicDirs: ['public', 'public/views'],
        compress: {
            enabled: true,
            options: {
                level: 6,
            },
        },
        cors: {
            enabled: true,
            options: {
                origin: '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true,
            },
        },
        logging: 'all',
        helmet: {
            enabled: false,
            options: {
                contentSecurityPolicy: false,
            },
        },
        session: {
            enabled: true,
            options: {
                sessionCookieName:
                    process.env.SESSION_COOKIENAME || 'cmmv-session',
                secret: process.env.SESSION_SECRET || 'secret',
                resave: false,
                saveUninitialized: false,
                cookie: {
                    secure: true,
                    maxAge: 60000,
                },
            },
        },
    },

    i18n: {
        localeFiles: './src/locale',
        default: 'en',
    },

    rpc: {
        enabled: true,
        preLoadContracts: true,
    },

    view: {
        extractInlineScript: false,
        minifyHTML: true,
        scriptsTimestamp: false,
    },

    repository: {
        type: 'sqlite',
        database: './database.sqlite',
        synchronize: true,
        logging: false,
    },

    cache: {
        store: '@tirke/node-cache-manager-ioredis',
        getter: 'ioRedisStore',
        host: 'localhost',
        port: 6379,
        ttl: 600,
    },

    auth: {
        localRegister: true,
        localLogin: true,
        jwtSecret: process.env.JWT_SECRET || 'secret',
        jwtSecretRefresh: process.env.JWT_SECRET_REFRESH || 'secret',
        expiresIn: 60 * 60 * 24,
        requireEmailValidation: true,
        google: {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:3000/auth/google/callback',
        },
        qrCode: {
            image: 'public/assets/favicon/android-chrome-512x512.png',
            type: 'canvas',
            shape: 'square',
            width: 300,
            height: 300,
            margin: 0,
            qrOptions: {
                typeNumber: '0',
                mode: 'Byte',
                errorCorrectionLevel: 'Q',
            },
        },
        recaptcha: {
            required: false,
            secret: process.env.RECAPTCHA_SECRET,
        },
        oneTimeToken: {
            enabled: true,
            expiresIn: 60 * 10,
            urlLink: 'http://localhost:3000/auth/one-time-token',
        },
    },

    keyv: {
        uri: 'redis://localhost:6379',
        options: {
            namespace: 'cmmv',
            ttl: 600,
            adapter: 'redis',
        },
    },

    head: {
        title: 'CMMV',
        htmlAttrs: {
            lang: 'pt-br',
        },
        meta: [
            { charset: 'utf-8' },
            {
                'http-equiv': 'content-type',
                content: 'text/html; charset=UTF-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
        ],
        link: [
            { rel: 'icon', href: 'assets/favicon/favicon.ico' },
            { rel: 'stylesheet', href: '/assets/bundle.min.css' },
        ],
    },

    scripts: [
        {
            type: 'module',
            src: '/assets/bundle.min.js',
            defer: 'defer',
        },
    ],

    vault: {
        namespace: process.env.VAULT_NAMESPACE,
        publicKey: process.env.VAULT_PUBLIC_KEY,
        privateKey: process.env.VAULT_PRIVATE_KEY,
    },

    openapi: {
        openapi: '3.0.4',
        info: {
            title: 'Contract-Model-Model-View (CMMV)',
            description:
                'CMMV is a minimalist Node.js framework focused on contract-driven development, combining automatic code generation, RPC communication, and declarative programming to build efficient, scalable applications with simplified backend and frontend integration.',
            version: '0.8.31',
        },
        servers: [{ url: 'http://localhost:3000' }],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                OAuth2: {
                    name: 'CMMV OAuth2',
                    type: 'oauth2',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    flows: {
                        password: {
                            authorizationUrl: '/oauth2/authorize',
                            tokenUrl: '/oauth2/token',
                            scopes: {
                                email: 'email',
                                openid: 'openid',
                                profile: 'profile',
                            },
                        },
                    },
                },
            },
        },
    },

    graphql: {
        host: 'localhost',
        port: 4000,
        generateResolvers: true,
    },

    email: {
        pixelUrl: 'http://localhost:3000/email/pixel',
        unsubscribeUrl: 'http://localhost:3000/email/unsubscribe',
        unsubscribeLinkApi: 'http://localhost:3000/auth/unsubscribe',
        from: process.env.EMAIL_FROM,
        secure: false,
        ignoreTLS: true,
        requireTLS: false,
        debug: true,
        SES: {
            region: process.env.AWS_REGION,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    },
};
