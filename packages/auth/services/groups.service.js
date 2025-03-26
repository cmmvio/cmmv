"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGroupsService = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
const http_1 = require("@cmmv/http");
const repository_1 = require("@cmmv/repository");
let AuthGroupsService = class AuthGroupsService extends core_1.AbstractService {
    async getAllGroups() {
        const GroupsEntity = repository_1.Repository.getEntity('GroupsEntity');
        const Groups = core_1.Application.getModel('Groups');
        const result = await repository_1.Repository.findAll(GroupsEntity, {});
        return {
            ...result,
            data: Groups.fromEntities(result.data),
        };
    }
    async getGroupsIn(inArr) {
        if (!inArr)
            throw new http_1.HttpException(`Ids must be defined in the URL query`, http_1.HttpStatus.INTERNAL_SERVER_ERROR);
        const GroupsEntity = repository_1.Repository.getEntity('GroupsEntity');
        const Groups = core_1.Application.getModel('Groups');
        const groupsToAssign = Array.isArray(inArr) ? inArr : [inArr];
        const result = await repository_1.Repository.findAll(GroupsEntity, repository_1.Repository.queryBuilder({
            id: { $in: groupsToAssign },
        }));
        return {
            ...result,
            data: Groups.fromEntities(result.data),
        };
    }
    async createGroup(payload) {
        const GroupsEntity = repository_1.Repository.getEntity('GroupsEntity');
        const exists = await repository_1.Repository.exists(GroupsEntity, {
            name: payload.name,
        });
        if (exists)
            throw new http_1.HttpException('Group name already exists', http_1.HttpStatus.BAD_REQUEST);
        const rolesArr = Array.isArray(payload.roles)
            ? payload.roles
            : [payload.roles];
        const result = await repository_1.Repository.insert(GroupsEntity, {
            name: payload.name,
            roles: rolesArr,
        });
        if (!result.success) {
            throw new http_1.HttpException('Failed to create group', http_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { message: 'Group created successfully' };
    }
    async updateGroup(groupId, payload) {
        const GroupsEntity = repository_1.Repository.getEntity('GroupsEntity');
        const group = await repository_1.Repository.findBy(GroupsEntity, { id: groupId });
        if (!group)
            throw new http_1.HttpException('Group not found', http_1.HttpStatus.NOT_FOUND);
        const rolesArr = Array.isArray(payload.roles)
            ? payload.roles
            : [payload.roles];
        const result = await repository_1.Repository.updateById(GroupsEntity, groupId, {
            name: payload.name ?? group.name,
            roles: rolesArr,
        });
        if (!result) {
            throw new http_1.HttpException('Failed to update group', http_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { message: 'Group updated successfully' };
    }
    async deleteGroup(groupId) {
        const GroupsEntity = repository_1.Repository.getEntity('GroupsEntity');
        const group = await repository_1.Repository.findBy(GroupsEntity, { id: groupId });
        if (!group)
            throw new http_1.HttpException('Group not found', http_1.HttpStatus.NOT_FOUND);
        const result = await repository_1.Repository.delete(GroupsEntity, groupId);
        if (!result) {
            throw new http_1.HttpException('Failed to delete group', http_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { message: 'Group deleted successfully' };
    }
    async assignRolesToGroup(groupId, rolesInput) {
        const GroupsEntity = repository_1.Repository.getEntity('GroupsEntity');
        const group = await repository_1.Repository.findBy(GroupsEntity, { id: groupId });
        if (!group)
            throw new http_1.HttpException('Group not found', http_1.HttpStatus.NOT_FOUND);
        const newRoles = Array.isArray(rolesInput) ? rolesInput : [rolesInput];
        const updatedRoles = Array.from(new Set([...group.roles, ...newRoles]));
        const result = await repository_1.Repository.updateById(GroupsEntity, groupId, {
            roles: updatedRoles,
        });
        if (!result) {
            throw new http_1.HttpException('Failed to assign roles to group', http_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { message: 'Roles assigned to group successfully' };
    }
    async removeRolesFromGroup(groupId, rolesInput) {
        const GroupsEntity = repository_1.Repository.getEntity('GroupsEntity');
        const group = await repository_1.Repository.findBy(GroupsEntity, { id: groupId });
        if (!group)
            throw new http_1.HttpException('Group not found', http_1.HttpStatus.NOT_FOUND);
        const rolesToRemove = Array.isArray(rolesInput)
            ? rolesInput
            : [rolesInput];
        const updatedRoles = group.roles.filter((role) => !rolesToRemove.includes(role));
        const result = await repository_1.Repository.updateById(GroupsEntity, groupId, {
            roles: updatedRoles,
        });
        if (!result) {
            throw new http_1.HttpException('Failed to remove roles from group', http_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { message: 'Roles removed from group successfully' };
    }
};
exports.AuthGroupsService = AuthGroupsService;
exports.AuthGroupsService = AuthGroupsService = tslib_1.__decorate([
    (0, core_1.Service)('auth_groups')
], AuthGroupsService);
