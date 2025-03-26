import { AbstractService } from '@cmmv/core';
import { IJWTDecoded } from '../lib/auth.interface';
export declare class AuthSessionsService extends AbstractService {
    static validateSession(user: IJWTDecoded | string): Promise<boolean>;
    static validateRefreshToken(refreshToken: string): Promise<boolean>;
    static getSessionFromRefreshToken(refreshToken: string): Promise<any | null>;
    registrySession(sessionId: string, req: any, fingerprint: string, user: string, refreshToken: string): Promise<boolean>;
    getSessions(queries: any, user: IJWTDecoded): Promise<{
        data: any;
        count?: number;
        pagination?: import("@cmmv/repository").IFindPagination;
    }>;
    revokeSession(sessionId: string, user: IJWTDecoded): Promise<boolean>;
    private extractDevice;
    private extractBrowser;
    private extractOS;
}
