import { AbstractContract } from '@cmmv/core';
export declare class UserContract extends AbstractContract {
    username: string;
    password: string;
    provider?: string;
    groups: Array<string>;
    roles: Array<string>;
    root: boolean;
    blocked: boolean;
    validated: boolean;
    verifyEmail: boolean;
    verifyEmailCode: number;
    verifySMS: boolean;
    verifySMSCode: number;
    optSecret: string;
    optSecretVerify: boolean;
    profile: string;
    LoginRequest: {
        username: string;
        password: string;
    };
    LoginResponse: {
        success: boolean;
        token: string;
        message: string;
    };
    Login: Function;
    RegisterRequest: {
        username: string;
        email: string;
        password: string;
    };
    RegisterResponse: {
        success: boolean;
        message: string;
    };
    Register: Function;
    GetCurrentUserRequest: Record<string, never>;
    GetCurrentUserResponse: {
        id: string;
        username: string;
        roles?: any;
        groups?: any;
        profile?: any;
    };
    GetCurrentUser: Function;
    BlockUserRequest: {
        userId: string;
    };
    BlockUserResponse: {
        message: string;
    };
    BlockUser: Function;
    UnblockUserRequest: {
        userId: string;
    };
    UnblockUserResponse: {
        message: string;
    };
    UnblockUser: Function;
    AssignGroupsToUserRequest: {
        userId: string;
        groups: string | string[];
    };
    AssignGroupsToUserResponse: {
        message: string;
    };
    AssignGroupsToUser: Function;
    RemoveGroupsFromUserRequest: {
        userId: string;
        groups: string | string[];
    };
    RemoveGroupsFromUserResponse: {
        success: boolean;
        message: string;
    };
    RemoveGroupsFromUser: Function;
}
