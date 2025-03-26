import { AbstractContract } from '@cmmv/core';
export declare class GroupsContract extends AbstractContract {
    name: string;
    roles: string[];
    GroupPayload: {
        name: string;
    };
    GroupRolesPayload: {
        roles: string[];
    };
    GroupResponse: {
        success: boolean;
        message?: string;
        data?: any;
    };
    GroupGetAll: Function;
    GroupGetIn: Function;
    GroupCreate: Function;
    GroupUpdate: Function;
    GroupDelete: Function;
    GroupAssignRoles: Function;
    GroupRemoveRoles: Function;
}
