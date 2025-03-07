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
