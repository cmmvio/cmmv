import { AbstractService } from '@cmmv/core';
import { LoginPayload, IGetRolesResponse } from '../lib/auth.interface';
import { AuthSessionsService } from './sessions.service';
import { AuthRecaptchaService } from './recaptcha.service';
export declare class AuthAutorizationService extends AbstractService {
    private readonly sessionsService;
    private readonly recaptchaService;
    constructor(sessionsService: AuthSessionsService, recaptchaService: AuthRecaptchaService);
    private isLocalhost;
    login(payload: LoginPayload, req?: any, res?: any, session?: any): Promise<{
        result: {
            token: any;
            refreshToken: any;
        };
        user: any;
    }>;
    register(payload: any): Promise<{
        message: string;
    }>;
    checkUsernameExists(username: string): Promise<boolean>;
    refreshToken(request: any, ctx?: any): Promise<{
        token: any;
    }>;
    getGroupsRoles(user: any): Promise<any[]>;
    getRoles(): Promise<IGetRolesResponse>;
    hasRole(name: string | string[]): Promise<boolean>;
    assignRoles(userId: string, rolesInput: string | string[]): Promise<{
        message: string;
    }>;
    removeRoles(userId: string, rolesInput: string | string[]): Promise<{
        success: boolean;
        message: string;
    }>;
}
