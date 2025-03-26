import { AbstractContract } from '@cmmv/core';
export declare class SessionsContract extends AbstractContract {
    uuid: string;
    fingerprint: string;
    user: string;
    ipAddress: string;
    device: string;
    browser: string;
    os: string;
    revoked: boolean;
    userAgent: string;
    refreshToken: string;
    GetSessionsRequest: {
        limit?: number;
        offset?: number;
        sortBy?: string;
        sort?: string;
    };
    GetSessionsResponse: {
        data: any[];
        count: number;
        total: number;
    };
    GetSessions: Function;
    ValidateSessionRequest: {
        token: string;
    };
    ValidateSessionResponse: {
        valid: boolean;
        user?: any;
    };
    ValidateSession: Function;
    RevokeSessionRequest: {
        sessionId: string;
    };
    RevokeSessionResponse: {
        success: boolean;
        message?: string;
    };
    RevokeSession: Function;
}
