import { Service, AbstractService, Application } from '@cmmv/core';

import { HttpException, HttpStatus } from '@cmmv/http';
import { Repository } from '@cmmv/repository';

import { GroupPayload } from '../lib/auth.interface';

@Service('auth_groups')
export class AuthGroupsService extends AbstractService {
    /**
     * Get all groups
     * @returns The groups
     */
    public async getAllGroups() {
        const GroupsEntity = Repository.getEntity('GroupsEntity');
        const Groups: any = Application.getModel('Groups');
        const result = await Repository.findAll(GroupsEntity, {});

        return {
            ...result,
            data: Groups.fromEntities(result.data),
        };
    }

    /**
     * Get groups in
     * @param inArr - The groups in
     * @returns The groups
     */
    public async getGroupsIn(inArr: string[] | string) {
        if (!inArr)
            throw new HttpException(
                `Ids must be defined in the URL query`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );

        const GroupsEntity = Repository.getEntity('GroupsEntity');
        const Groups: any = Application.getModel('Groups');
        const groupsToAssign = Array.isArray(inArr) ? inArr : [inArr];

        const result = await Repository.findAll(
            GroupsEntity,
            Repository.queryBuilder({
                id: { $in: groupsToAssign },
            }),
        );

        return {
            ...result,
            data: Groups.fromEntities(result.data),
        };
    }

    /**
     * Create a group
     * @param payload - The payload
     * @returns The message
     */
    public async createGroup(payload: GroupPayload) {
        const GroupsEntity = Repository.getEntity('GroupsEntity');
        const exists = await Repository.exists(GroupsEntity, {
            name: payload.name,
        });

        if (exists)
            throw new HttpException(
                'Group name already exists',
                HttpStatus.BAD_REQUEST,
            );

        const rolesArr = Array.isArray(payload.roles)
            ? payload.roles
            : [payload.roles];

        const result = await Repository.insert(GroupsEntity, {
            name: payload.name,
            roles: rolesArr,
        });

        if (!result.success) {
            throw new HttpException(
                'Failed to create group',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'Group created successfully' };
    }

    /**
     * Update a group
     * @param groupId - The group id
     * @param payload - The payload
     * @returns The message
     */
    public async updateGroup(groupId: string, payload: Partial<GroupPayload>) {
        const GroupsEntity = Repository.getEntity('GroupsEntity');

        const group = await Repository.findBy(GroupsEntity, { id: groupId });

        if (!group)
            throw new HttpException('Group not found', HttpStatus.NOT_FOUND);

        const rolesArr = Array.isArray(payload.roles)
            ? payload.roles
            : [payload.roles];

        const result = await Repository.updateById(GroupsEntity, groupId, {
            name: payload.name ?? group.name,
            roles: rolesArr,
        });

        if (!result) {
            throw new HttpException(
                'Failed to update group',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'Group updated successfully' };
    }

    /**
     * Delete a group
     * @param groupId - The group id
     * @returns The message
     */
    public async deleteGroup(groupId: string) {
        const GroupsEntity = Repository.getEntity('GroupsEntity');

        const group = await Repository.findBy(GroupsEntity, { id: groupId });

        if (!group)
            throw new HttpException('Group not found', HttpStatus.NOT_FOUND);

        const result = await Repository.delete(GroupsEntity, groupId);

        if (!result) {
            throw new HttpException(
                'Failed to delete group',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'Group deleted successfully' };
    }

    /**
     * Assign roles to a group
     * @param groupId - The group id
     * @param rolesInput - The roles input
     * @returns The message
     */
    public async assignRolesToGroup(
        groupId: string,
        rolesInput: string | string[],
    ) {
        const GroupsEntity = Repository.getEntity('GroupsEntity');

        const group = await Repository.findBy(GroupsEntity, { id: groupId });

        if (!group)
            throw new HttpException('Group not found', HttpStatus.NOT_FOUND);

        const newRoles = Array.isArray(rolesInput) ? rolesInput : [rolesInput];
        const updatedRoles = Array.from(new Set([...group.roles, ...newRoles]));

        const result = await Repository.updateById(GroupsEntity, groupId, {
            roles: updatedRoles,
        });

        if (!result) {
            throw new HttpException(
                'Failed to assign roles to group',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'Roles assigned to group successfully' };
    }

    /**
     * Remove roles from a group
     * @param groupId - The group id
     * @param rolesInput - The roles input
     * @returns The message
     */
    public async removeRolesFromGroup(
        groupId: string,
        rolesInput: string | string[],
    ) {
        const GroupsEntity = Repository.getEntity('GroupsEntity');

        const group = await Repository.findBy(GroupsEntity, { id: groupId });

        if (!group)
            throw new HttpException('Group not found', HttpStatus.NOT_FOUND);

        const rolesToRemove = Array.isArray(rolesInput)
            ? rolesInput
            : [rolesInput];
        const updatedRoles = group.roles.filter(
            (role) => !rolesToRemove.includes(role),
        );

        const result = await Repository.updateById(GroupsEntity, groupId, {
            roles: updatedRoles,
        });

        if (!result) {
            throw new HttpException(
                'Failed to remove roles from group',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'Roles removed from group successfully' };
    }
}
