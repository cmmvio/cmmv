import { AbstractService } from '@cmmv/core';
import { AuthGroupsService } from './groups.service';
export declare class AuthUsersService extends AbstractService {
    private readonly groupsService;
    constructor(groupsService: AuthGroupsService);
    blockUser(userId: string): Promise<{
        message: string;
    }>;
    unblockUser(userId: string): Promise<{
        message: string;
    }>;
    static resolveGroups(user: any): Promise<any>;
    assignGroupsToUser(userId: string, groupsInput: string | string[]): Promise<{
        message: string;
    }>;
    removeGroupsFromUser(userId: string, groupsInput: string | string[]): Promise<{
        success: boolean;
        message: string;
    }>;
}
