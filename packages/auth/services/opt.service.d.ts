import { AbstractService } from '@cmmv/core';
export declare class AuthOptService extends AbstractService {
    generateOptSecret(token: string): Promise<string>;
    validateOptSecret(token: string, secret: string): Promise<{
        success: boolean;
    }>;
    updateOptSecret(token: string, secret: string): Promise<{
        success: boolean;
    }>;
    removeOptSecret(token: string, secret: string): Promise<{
        success: boolean;
    }>;
}
