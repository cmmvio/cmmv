import { AbstractService } from '@cmmv/core';
import { GroupPayload } from '../lib/auth.interface';
export declare class AuthGroupsService extends AbstractService {
    getAllGroups(): Promise<{
        data: any;
        count?: number;
        pagination?: import("@cmmv/repository").IFindPagination;
    }>;
    getGroupsIn(inArr: string[] | string): Promise<{
        data: any;
        count?: number;
        pagination?: import("@cmmv/repository").IFindPagination;
    }>;
    createGroup(payload: GroupPayload): Promise<{
        message: string;
    }>;
    updateGroup(groupId: string, payload: Partial<GroupPayload>): Promise<{
        message: string;
    }>;
    deleteGroup(groupId: string): Promise<{
        message: string;
    }>;
    assignRolesToGroup(groupId: string, rolesInput: string | string[]): Promise<{
        message: string;
    }>;
    removeRolesFromGroup(groupId: string, rolesInput: string | string[]): Promise<{
        message: string;
    }>;
}
