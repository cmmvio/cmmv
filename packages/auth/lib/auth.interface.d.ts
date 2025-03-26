export interface LoginPayload {
    username: string;
    password: string;
    token?: string;
    opt?: string;
}
export interface IAuthSettings {
    roles?: string[];
    groups?: string[];
    rootOnly?: boolean;
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
export declare const LoginPayloadSchema: {
    content: {
        'application/json': {
            schema: {
                type: string;
                properties: {
                    username: {
                        type: string;
                        required: boolean;
                    };
                    password: {
                        type: string;
                        required: boolean;
                    };
                    token: {
                        type: string;
                        required: boolean;
                    };
                    opt: {
                        type: string;
                        required: boolean;
                    };
                };
            };
            examples: {
                default: {
                    value: {
                        username: string;
                        password: string;
                    };
                };
                reCAPTCHA: {
                    value: {
                        username: string;
                        password: string;
                        token: string;
                    };
                };
                F2A: {
                    value: {
                        username: string;
                        password: string;
                        token: string;
                        opt: string;
                    };
                };
            };
        };
    };
};
export declare const LoginReturnSchema: {
    description: string;
    headers: {
        'set-cookie': {
            schema: {
                type: string;
                description: string;
            };
        };
    };
    content: {
        'application/json': {
            schema: {
                type: string;
                properties: {
                    status: {
                        type: string;
                    };
                    processingTime: {
                        type: string;
                    };
                    result: {
                        type: string;
                        properties: {
                            token: {
                                type: string;
                            };
                            refreshToken: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
};
export declare const RegistryPayloadSchema: {
    required: boolean;
    content: {
        'application/json': {
            schema: {
                type: string;
                properties: {
                    username: {
                        type: string;
                    };
                    password: {
                        type: string;
                    };
                };
            };
        };
    };
};
export declare const RegistryReturnSchema: {
    description: string;
    content: {
        'application/json': {
            schema: {
                type: string;
                properties: {
                    status: {
                        type: string;
                    };
                    processingTime: {
                        type: string;
                    };
                    result: {
                        type: string;
                        properties: {
                            message: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
};
export declare const CheckTokenReturnSchema: {
    content: {
        'application/json': {
            schema: {
                type: string;
                properties: {
                    sucess: {
                        type: string;
                    };
                };
            };
        };
    };
};
export declare const CheckUsernamePayloadSchema: {
    required: boolean;
    content: {
        'application/json': {
            schema: {
                type: string;
                properties: {
                    username: {
                        type: string;
                    };
                };
            };
        };
    };
};
export declare const CheckUsernameReturnSchema: {
    content: {
        'text/plain': {
            schema: {
                type: string;
            };
        };
    };
};
export declare const RefreshTokenHeadersSchema: {
    in: string;
    name: string;
    required: boolean;
    schema: {
        type: string;
    };
}[];
export declare const RefreshTokenReturnSchema: {
    content: {
        'application/json': {
            schema: {
                type: string;
                properties: {
                    status: {
                        type: string;
                    };
                    processingTime: {
                        type: string;
                    };
                    result: {
                        type: string;
                        properties: {
                            token: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
};
