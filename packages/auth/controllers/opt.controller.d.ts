import { AuthOptService } from '../services/opt.service';
export declare class AuthOPTController {
    private readonly optService;
    constructor(optService: AuthOptService);
    handlerGenerateOptSecret(token: any): Promise<string>;
    handlerEnable2FA(token: any, payload: any): Promise<{
        success: boolean;
    }>;
    handlerRemoveOptSecret(token: any, payload: any): Promise<{
        success: boolean;
    }>;
    handlerValidateOptSecret(token: any, payload: any): Promise<{
        success: boolean;
    }>;
}
