import { AuthSessionsService } from '../services/sessions.service';
export declare class AuthSessionsController {
    private readonly sessionsService;
    constructor(sessionsService: AuthSessionsService);
    getSessions(queries: any, user: any): Promise<{
        data: any;
        count?: number;
        pagination?: import("@cmmv/repository").IFindPagination;
    }>;
    validateSession(body: {
        token: string;
    }): Promise<{
        valid: boolean;
        user: {
            id: any;
            username: any;
        };
    } | {
        valid: boolean;
        user?: undefined;
    }>;
    revokeSession(body: {
        sessionId: string;
    }, user: any): Promise<{
        success: boolean;
        message: any;
    }>;
    private extractUserFromToken;
}
