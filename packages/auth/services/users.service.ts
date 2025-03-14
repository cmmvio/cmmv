import { Service, AbstractService, Resolver, Application } from '@cmmv/core';

import { Repository } from '@cmmv/repository';
import { HttpException, HttpStatus } from '@cmmv/http';

import { AuthGroupsService } from './groups.service';

@Service('auth_users')
export class AuthUsersService extends AbstractService {
    constructor(private readonly groupsService: AuthGroupsService) {
        super();
    }

    /* Block */
    public async blockUser(userId: string): Promise<{ message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');

        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({ id: userId }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        if (user.blocked) {
            throw new HttpException(
                'User is already blocked',
                HttpStatus.BAD_REQUEST,
            );
        }

        const result = await Repository.update(UserEntity, userId, {
            blocked: true,
        });

        if (result <= 0) {
            throw new HttpException(
                'Failed to block user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'User blocked successfully' };
    }

    public async unblockUser(userId: string): Promise<{ message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');

        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({ id: userId }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        if (!user.blocked) {
            throw new HttpException(
                'User is already unblocked',
                HttpStatus.BAD_REQUEST,
            );
        }

        const result = await Repository.update(UserEntity, userId, {
            blocked: false,
        });

        if (result <= 0) {
            throw new HttpException(
                'Failed to unblock user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'User unblocked successfully' };
    }

    /* Groups */
    @Resolver('user-groups')
    public static async resolveGroups(user: any) {
        const GroupsEntity = Repository.getEntity('GroupsEntity');
        const Groups: any = Application.getModel('Groups');
        let groupsToAssign = Array.isArray(user.groups)
            ? user.groups
            : [user.groups];

        groupsToAssign = groupsToAssign.filter((item) => item);

        if (groupsToAssign.length > 0) {
            const groups = await Repository.findAll(
                GroupsEntity,
                Repository.queryBuilder({
                    id: { $in: groupsToAssign },
                }),
            );

            let roles = new Set<string>(user.roles ?? []);
            const groupsModels = Groups.fromEntities(groups.data);
            groupsModels.map((group) =>
                group.roles?.map((roleName) => roles.add(roleName)),
            );
            user.groups = groupsModels;
            user.roles = Array.from(roles);
        }

        return user;
    }

    public async assignGroupsToUser(
        userId: string,
        groupsInput: string | string[],
    ): Promise<{ message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');
        const GroupsEntity = Repository.getEntity('GroupsEntity');
        const user = await Repository.findBy(UserEntity, { id: userId });

        if (!user)
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        const groupsToAssign = Array.isArray(groupsInput)
            ? groupsInput
            : [groupsInput];

        const validGroups = await Repository.findAll(
            GroupsEntity,
            Repository.queryBuilder({
                id: { $in: groupsToAssign },
            }),
        );

        const validGroupIds = validGroups.data.map((group) => group.id);
        const invalidGroups = groupsToAssign.filter(
            (groupId) => !validGroupIds.includes(groupId),
        );

        if (invalidGroups.length > 0) {
            throw new HttpException(
                `Invalid groups: ${invalidGroups.join(', ')}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        const updatedGroups = Array.from(
            new Set([...(user.groups || []), ...validGroupIds]),
        );

        const result = await Repository.updateById(UserEntity, userId, {
            groups: updatedGroups,
        });

        if (!result) {
            throw new HttpException(
                'Failed to assign groups to user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'Groups assigned to user successfully' };
    }

    public async removeGroupsFromUser(
        userId: string,
        groupsInput: string | string[],
    ): Promise<{ success: boolean; message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');
        const GroupsEntity = Repository.getEntity('GroupsEntity');
        const user = await Repository.findBy(UserEntity, { id: userId });

        if (!user)
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        const groupsToRemove = Array.isArray(groupsInput)
            ? groupsInput
            : [groupsInput];

        const validGroups = await Repository.findAll(
            GroupsEntity,
            Repository.queryBuilder({
                id: { $in: groupsToRemove },
            }),
        );

        const validGroupIds = validGroups.data.map((group) => group.id);

        const invalidGroups = groupsToRemove.filter(
            (groupId) => !validGroupIds.includes(groupId),
        );

        if (invalidGroups.length > 0) {
            throw new HttpException(
                `Invalid groups: ${invalidGroups.join(', ')}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        const updatedGroups = (user.groups || []).filter(
            (groupId) => !validGroupIds.includes(groupId),
        );

        const result = await Repository.updateById(UserEntity, userId, {
            groups: updatedGroups,
        });

        if (!result) {
            throw new HttpException(
                'Failed to remove groups from user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return {
            success: true,
            message: 'Groups removed from user successfully',
        };
    }
}
