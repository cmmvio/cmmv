export interface LoginPayload {
    username: string;
    password: string;
    token?: string;
    opt?: string;
}

export interface RegisterPayload {
    username: string;
    password: string;
    email?: string;
}

export interface IAuthSettings {
    roles?: string[];
    groups?: string[];
    rootOnly?: boolean;
}

export interface ITokenReturn {
    token: string;
    refreshToken: string;
}

export interface IOAuthClient {
    clientName: string;
    clientId: string;
    clientSecret: string;
    redirectUris: string[];
    allowedScopes: string[];
    allowedGrantTypes: string[];
    authorizedDomains: string[];
    isActive: boolean;
    accessTokenLifetime: number;
    refreshTokenLifetime: number;
}

export interface IOAuthAuthQuery {
    client_id: string;
    redirect_uri: string;
    response_type: string;
    state: string;
    scope: string;
    origin: string;
    referer: string;
    agent: string;
}

export interface IOAuthAutorizeBody {
    client_id: string;
    redirect_uri: string;
    response_type: string;
    state: string;
    scope: string;
    origin: string;
    referer: string;
    agent: string;
}

export interface IOAuthHandlerQuery {
    code: string;
    state: string;
    response_type: string;
    redirect_uri: string;
    client_secret: string;
}

export interface IJWTDecoded {
    id: string;
    username: string;
    fingerprint: string;
    root: boolean;
    roles?: string[];
    groups?: string[];
}

export interface IRoleContract {
    rootOnly: boolean;
    roles: string[];
}

export interface IGetRolesResponse {
    contracts: Record<string, IRoleContract>;
}

export interface GroupPayload {
    name: string;
    roles?: string | string[];
}

export interface GroupRolesPayload {
    roles: string | string[];
}

export enum ETokenType {
    EMAIL_VALIDATION = 'email_validation',
    PASSWORD_RESET = 'password_reset',
    RECOVER_ACCOUNT = 'recover_account',
    MAGIC_LINK = 'magic_link',
}

//Schemas
export const LoginPayloadSchema = {
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

export const LoginReturnSchema = {
    description: 'Login response schema',
    headers: {
        'set-cookie': {
            schema: {
                type: 'string',
                description:
                    'Session cookie for authentication if application is enabled',
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

export const RegistryPayloadSchema = {
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

export const RegistryReturnSchema = {
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

export const CheckTokenReturnSchema = {
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

export const CheckUsernamePayloadSchema = {
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

export const CheckUsernameReturnSchema = {
    content: {
        'text/plain': {
            schema: {
                type: 'boolean',
            },
        },
    },
};

export const RefreshTokenHeadersSchema = [
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

export const RefreshTokenReturnSchema = {
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

export const ForgotPasswordPayloadSchema = {
    required: true,
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                },
            },
        },
    },
};
