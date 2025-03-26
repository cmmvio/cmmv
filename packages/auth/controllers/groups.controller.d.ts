import { AuthGroupsService } from '../services/groups.service';
import { GroupPayload, GroupRolesPayload } from '../lib/auth.interface';
export declare class AuthGroupsController {
    private readonly groupsService;
    constructor(groupsService: AuthGroupsService);
    handlerGroupGetAll(): Promise<{
        data: any;
        count?: number;
        pagination?: import("@cmmv/repository").IFindPagination;
    }>;
    handlerGroupGetIn(ids: string[] | string): Promise<{
        data: any;
        count?: number;
        pagination?: import("@cmmv/repository").IFindPagination;
    }>;
    handlerCreateGroup(payload: GroupPayload): Promise<{
        message: string;
    }>;
    handlerUpdateGroup(groupId: any, payload: GroupPayload): Promise<{
        message: string;
    }>;
    handlerDeleteGroup(groupId: any): Promise<{
        message: string;
    }>;
    handlerAssignRolesToGroup(groupId: any, payload: GroupRolesPayload): Promise<{
        message: string;
    }>;
    handlerRemoveRolesFromGroup(groupId: any, payload: GroupRolesPayload): Promise<{
        message: string;
    }>;
}
