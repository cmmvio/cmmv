"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUsersService = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
const repository_1 = require("@cmmv/repository");
const http_1 = require("@cmmv/http");
const groups_service_1 = require("./groups.service");
let AuthUsersService = class AuthUsersService extends core_1.AbstractService {
    constructor(groupsService) {
        super();
        this.groupsService = groupsService;
    }
    /* Block */
    async blockUser(userId) {
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        const user = await repository_1.Repository.findBy(UserEntity, repository_1.Repository.queryBuilder({ id: userId }));
        if (!user)
            throw new http_1.HttpException('User not found', http_1.HttpStatus.BAD_REQUEST);
        if (user.blocked) {
            throw new http_1.HttpException('User is already blocked', http_1.HttpStatus.BAD_REQUEST);
        }
        const result = await repository_1.Repository.update(UserEntity, userId, {
            blocked: true,
        });
        if (result <= 0) {
            throw new http_1.HttpException('Failed to block user', http_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { message: 'User blocked successfully' };
    }
    async unblockUser(userId) {
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        const user = await repository_1.Repository.findBy(UserEntity, repository_1.Repository.queryBuilder({ id: userId }));
        if (!user)
            throw new http_1.HttpException('User not found', http_1.HttpStatus.BAD_REQUEST);
        if (!user.blocked) {
            throw new http_1.HttpException('User is already unblocked', http_1.HttpStatus.BAD_REQUEST);
        }
        const result = await repository_1.Repository.update(UserEntity, userId, {
            blocked: false,
        });
        if (result <= 0) {
            throw new http_1.HttpException('Failed to unblock user', http_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { message: 'User unblocked successfully' };
    }
    /* Groups */
    static async resolveGroups(user) {
        const GroupsEntity = repository_1.Repository.getEntity('GroupsEntity');
        const Groups = core_1.Application.getModel('Groups');
        let groupsToAssign = Array.isArray(user.groups)
            ? user.groups
            : [user.groups];
        groupsToAssign = groupsToAssign.filter((item) => item);
        if (groupsToAssign.length > 0) {
            const groups = await repository_1.Repository.findAll(GroupsEntity, repository_1.Repository.queryBuilder({
                id: { $in: groupsToAssign },
            }));
            let roles = new Set(user.roles ?? []);
            const groupsModels = Groups.fromEntities(groups.data);
            groupsModels.map((group) => group.roles?.map((roleName) => roles.add(roleName)));
            user.groups = groupsModels;
            user.roles = Array.from(roles);
        }
        return user;
    }
    async assignGroupsToUser(userId, groupsInput) {
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        const GroupsEntity = repository_1.Repository.getEntity('GroupsEntity');
        const user = await repository_1.Repository.findBy(UserEntity, { id: userId });
        if (!user)
            throw new http_1.HttpException('User not found', http_1.HttpStatus.NOT_FOUND);
        const groupsToAssign = Array.isArray(groupsInput)
            ? groupsInput
            : [groupsInput];
        const validGroups = await repository_1.Repository.findAll(GroupsEntity, repository_1.Repository.queryBuilder({
            id: { $in: groupsToAssign },
        }));
        const validGroupIds = validGroups.data.map((group) => group.id);
        const invalidGroups = groupsToAssign.filter((groupId) => !validGroupIds.includes(groupId));
        if (invalidGroups.length > 0) {
            throw new http_1.HttpException(`Invalid groups: ${invalidGroups.join(', ')}`, http_1.HttpStatus.BAD_REQUEST);
        }
        const updatedGroups = Array.from(new Set([...(user.groups || []), ...validGroupIds]));
        const result = await repository_1.Repository.updateById(UserEntity, userId, {
            groups: updatedGroups,
        });
        if (!result) {
            throw new http_1.HttpException('Failed to assign groups to user', http_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { message: 'Groups assigned to user successfully' };
    }
    async removeGroupsFromUser(userId, groupsInput) {
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        const GroupsEntity = repository_1.Repository.getEntity('GroupsEntity');
        const user = await repository_1.Repository.findBy(UserEntity, { id: userId });
        if (!user)
            throw new http_1.HttpException('User not found', http_1.HttpStatus.NOT_FOUND);
        const groupsToRemove = Array.isArray(groupsInput)
            ? groupsInput
            : [groupsInput];
        const validGroups = await repository_1.Repository.findAll(GroupsEntity, repository_1.Repository.queryBuilder({
            id: { $in: groupsToRemove },
        }));
        const validGroupIds = validGroups.data.map((group) => group.id);
        const invalidGroups = groupsToRemove.filter((groupId) => !validGroupIds.includes(groupId));
        if (invalidGroups.length > 0) {
            throw new http_1.HttpException(`Invalid groups: ${invalidGroups.join(', ')}`, http_1.HttpStatus.BAD_REQUEST);
        }
        const updatedGroups = (user.groups || []).filter((groupId) => !validGroupIds.includes(groupId));
        const result = await repository_1.Repository.updateById(UserEntity, userId, {
            groups: updatedGroups,
        });
        if (!result) {
            throw new http_1.HttpException('Failed to remove groups from user', http_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return {
            success: true,
            message: 'Groups removed from user successfully',
        };
    }
};
exports.AuthUsersService = AuthUsersService;
tslib_1.__decorate([
    (0, core_1.Resolver)('user-groups'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthUsersService, "resolveGroups", null);
exports.AuthUsersService = AuthUsersService = tslib_1.__decorate([
    (0, core_1.Service)('auth_users'),
    tslib_1.__metadata("design:paramtypes", [groups_service_1.AuthGroupsService])
], AuthUsersService);
