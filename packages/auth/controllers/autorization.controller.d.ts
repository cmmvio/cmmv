import { LoginPayload } from '../lib/auth.interface';
import { AuthAutorizationService } from '../services/autorization.service';
export declare class AutorizationController {
    private readonly autorizationService;
    constructor(autorizationService: AuthAutorizationService);
    handlerLogin(payload: LoginPayload, req: any, res: any, session: any): Promise<false | {
        token: any;
        refreshToken: any;
    }>;
    handlerRegister(payload: any): Promise<false | {
        message: string;
    }>;
    handlerCheckToken(): Promise<{
        success: boolean;
    }>;
    handlerCheckUsername(payload: {
        username: string;
    }, res: any): Promise<void>;
    handlerRefreshToken(req: any): Promise<{
        token: any;
    }>;
    handlerGetRoles(): Promise<import("../lib/auth.interface").IGetRolesResponse>;
    handlerAssignRoles(userId: any, payload: {
        roles: string | string[];
    }): Promise<{
        message: string;
    }>;
    handlerRemoveRoles(userId: any, payload: {
        roles: string | string[];
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
