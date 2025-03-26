import { AuthUsersService } from '../services/users.service';
export declare class AuthUsersController {
    private readonly usersService;
    constructor(usersService: AuthUsersService);
    user(user: any): Promise<any>;
    handlerBlockUser(userId: any): Promise<{
        message: string;
    }>;
    handlerUnblockUser(userId: any): Promise<{
        message: string;
    }>;
    handlerAssignGroupsToUser(userId: any, payload: {
        groups: string | string[];
    }): Promise<{
        message: string;
    }>;
    handlerRemoveGroups(userId: any, payload: {
        groups: string | string[];
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
