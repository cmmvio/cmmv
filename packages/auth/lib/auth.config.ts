import { ConfigSchema } from '@cmmv/core';

export const AuthConfig: ConfigSchema = {
    auth: {
        localRegister: {
            required: true,
            type: 'boolean',
            default: true,
        },
        localLogin: {
            required: true,
            type: 'boolean',
            default: true,
        },
        jwtSecret: {
            required: true,
            type: 'string',
            default: 'secret',
        },
        jwtSecretRefresh: {
            required: true,
            type: 'string',
            default: 'refreshsecret',
        },
        refreshCookieName: {
            required: false,
            type: 'string',
            default: 'refreshToken',
        },
        expiresIn: {
            required: true,
            type: 'number',
            default: 60 * 60 * 24,
        },
        requireEmailValidation: {
            required: false,
            type: 'boolean',
            default: false,
        },
        google: {
            required: false,
            type: 'object',
            default: {},
            properties: {
                clientID: {
                    required: false,
                    type: 'string',
                    default: '',
                },
                clientSecret: {
                    required: false,
                    type: 'string',
                    default: '',
                },
                callbackURL: {
                    required: false,
                    type: 'string',
                    default: 'http://localhost:3000/auth/google/callback',
                },
            },
        },
        optSecret: {
            required: false,
            type: 'object',
            default: {},
            properties: {
                required: {
                    required: false,
                    type: 'boolean',
                    default: false,
                },
                issuer: {
                    required: false,
                    type: 'string',
                    default: 'CMMV',
                },
                algorithm: {
                    required: false,
                    type: 'string',
                    default: 'sha512',
                },
            },
        },
        qrCode: {
            required: false,
            type: 'object',
            default: {},
            properties: {
                image: {
                    required: false,
                    type: 'string',
                    default: 'public/assets/favicon/android-chrome-512x512.png',
                },
                type: {
                    required: false,
                    type: 'string',
                    default: 'canvas',
                },
                shape: {
                    required: false,
                    type: 'string',
                    default: 'square',
                },
                width: {
                    required: false,
                    type: 'number',
                    default: 300,
                },
                height: {
                    required: false,
                    type: 'number',
                    default: 300,
                },
                margin: {
                    required: false,
                    type: 'number',
                    default: 0,
                },
                qrOptions: {
                    required: false,
                    type: 'object',
                    default: {},
                    properties: {
                        typeNumber: {
                            required: false,
                            type: 'string',
                            default: '0',
                        },
                        mode: {
                            required: false,
                            type: 'string',
                            default: 'Byte',
                        },
                        errorCorrectionLevel: {
                            required: false,
                            type: 'string',
                            default: 'Q',
                        },
                    },
                },
                imageOptions: {
                    required: false,
                    type: 'object',
                    default: {},
                    properties: {
                        saveAsBlob: {
                            required: false,
                            type: 'boolean',
                            default: true,
                        },
                        hideBackgroundDots: {
                            required: false,
                            type: 'boolean',
                            default: true,
                        },
                        imageSize: {
                            required: false,
                            type: 'number',
                            default: 0.4,
                        },
                        margin: {
                            required: false,
                            type: 'number',
                            default: 0,
                        },
                    },
                },
                dotsOptions: {
                    required: false,
                    type: 'object',
                    default: {},
                    properties: {
                        type: {
                            required: false,
                            type: 'string',
                            default: 'square',
                        },
                        color: {
                            required: false,
                            type: 'string',
                            default: '#000000',
                        },
                        roundSize: {
                            required: false,
                            type: 'boolean',
                            default: true,
                        },
                    },
                },
                backgroundOptions: {
                    required: false,
                    type: 'object',
                    default: {},
                    properties: {
                        round: {
                            required: false,
                            type: 'number',
                            default: 0,
                        },
                        color: {
                            required: false,
                            type: 'string',
                            default: '#ffffff',
                        },
                    },
                },
                cornersSquareOptions: {
                    required: false,
                    type: 'object',
                    default: {},
                    properties: {
                        type: {
                            required: false,
                            type: 'string',
                            default: 'dot',
                        },
                        color: {
                            required: false,
                            type: 'string',
                            default: '#000000',
                        },
                    },
                },
                cornersDotOptions: {
                    required: false,
                    type: 'object',
                    default: {},
                    properties: {
                        type: {
                            required: false,
                            type: 'string',
                            default: '',
                        },
                        color: {
                            required: false,
                            type: 'string',
                            default: '#000000',
                        },
                    },
                },
                dotsOptionsHelper: {
                    required: false,
                    type: 'object',
                    default: {},
                    properties: {
                        colorType: {
                            required: false,
                            type: 'object',
                            default: {},
                            properties: {
                                single: {
                                    required: false,
                                    type: 'boolean',
                                    default: true,
                                },
                                gradient: {
                                    required: false,
                                    type: 'boolean',
                                    default: false,
                                },
                            },
                        },
                        gradient: {
                            required: false,
                            type: 'object',
                            default: {},
                            properties: {
                                linear: {
                                    required: false,
                                    type: 'boolean',
                                    default: true,
                                },
                                radial: {
                                    required: false,
                                    type: 'boolean',
                                    default: false,
                                },
                                color1: {
                                    required: false,
                                    type: 'string',
                                    default: '#6a1a4c',
                                },
                                color2: {
                                    required: false,
                                    type: 'string',
                                    default: '#6a1a4c',
                                },
                                rotation: {
                                    required: false,
                                    type: 'string',
                                    default: '0',
                                },
                            },
                        },
                    },
                },
                cornersSquareOptionsHelper: {
                    required: false,
                    type: 'object',
                    default: {},
                    properties: {
                        colorType: {
                            required: false,
                            type: 'object',
                            default: {},
                            properties: {
                                single: {
                                    required: false,
                                    type: 'boolean',
                                    default: true,
                                },
                                gradient: {
                                    required: false,
                                    type: 'boolean',
                                    default: false,
                                },
                            },
                        },
                        gradient: {
                            required: false,
                            type: 'object',
                            default: {},
                            properties: {
                                linear: {
                                    required: false,
                                    type: 'boolean',
                                    default: true,
                                },
                                radial: {
                                    required: false,
                                    type: 'boolean',
                                    default: false,
                                },
                                color1: {
                                    required: false,
                                    type: 'string',
                                    default: '#000000',
                                },
                                color2: {
                                    required: false,
                                    type: 'string',
                                    default: '#000000',
                                },
                                rotation: {
                                    required: false,
                                    type: 'string',
                                    default: '0',
                                },
                            },
                        },
                    },
                },
                backgroundOptionsHelper: {
                    required: false,
                    type: 'object',
                    default: {},
                    properties: {
                        colorType: {
                            required: false,
                            type: 'object',
                            default: {},
                            properties: {
                                single: {
                                    required: false,
                                    type: 'boolean',
                                    default: true,
                                },
                                gradient: {
                                    required: false,
                                    type: 'boolean',
                                    default: false,
                                },
                            },
                        },
                        gradient: {
                            required: false,
                            type: 'object',
                            default: {},
                            properties: {
                                linear: {
                                    required: false,
                                    type: 'boolean',
                                    default: true,
                                },
                                radial: {
                                    required: false,
                                    type: 'boolean',
                                    default: false,
                                },
                                color1: {
                                    required: false,
                                    type: 'string',
                                    default: '#ffffff',
                                },
                                color2: {
                                    required: false,
                                    type: 'string',
                                    default: '#ffffff',
                                },
                                rotation: {
                                    required: false,
                                    type: 'string',
                                    default: '0',
                                },
                            },
                        },
                    },
                },
            },
        },
        recaptcha: {
            required: false,
            type: 'object',
            properties: {
                required: {
                    required: false,
                    type: 'boolean',
                    default: false,
                },
                secret: {
                    required: false,
                    type: 'string',
                },
            },
        },
        oneTimeToken: {
            required: false,
            type: 'object',
            default: {},
            properties: {
                enabled: {
                    required: false,
                    type: 'boolean',
                    default: false,
                },
                expiresIn: {
                    required: false,
                    type: 'number',
                    default: 60 * 10,
                },
                urlLink: {
                    required: false,
                    type: 'string',
                    default: 'http://localhost:3000/auth/one-time-token',
                },
            },
        },
        templates: {
            required: false,
            type: 'object',
            default: {},
            properties: {
                auth: {
                    required: false,
                    type: 'string',
                },
                emailForgotPassword: {
                    required: false,
                    type: 'string',
                },
                forgotPassword: {
                    required: false,
                    type: 'string',
                },
                emailConfirmation: {
                    required: false,
                    type: 'string',
                },
                unsubscribe: {
                    required: false,
                    type: 'string',
                },
            },
        },
    },

    password: {
        requireUpperCase: {
            type: 'boolean',
            required: false,
            default: true,
        },
        requireLowerCase: {
            type: 'boolean',
            required: false,
            default: true,
        },
        requireNumber: {
            type: 'boolean',
            required: false,
            default: true,
        },
        requireSpecialChar: {
            type: 'boolean',
            required: false,
            default: true,
        },
        minLength: {
            type: 'number',
            required: false,
            default: 8,
        },
    },
};
