"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGroupsController = void 0;
const tslib_1 = require("tslib");
const http_1 = require("@cmmv/http");
const groups_service_1 = require("../services/groups.service");
const auth_decorator_1 = require("../lib/auth.decorator");
const groups_contract_1 = require("../contracts/groups.contract");
let AuthGroupsController = class AuthGroupsController {
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    async handlerGroupGetAll() {
        return this.groupsService.getAllGroups();
    }
    async handlerGroupGetIn(ids) {
        return this.groupsService.getGroupsIn(ids);
    }
    async handlerCreateGroup(payload) {
        return this.groupsService.createGroup(payload);
    }
    async handlerUpdateGroup(groupId, payload) {
        return this.groupsService.updateGroup(groupId, payload);
    }
    async handlerDeleteGroup(groupId) {
        return this.groupsService.deleteGroup(groupId);
    }
    async handlerAssignRolesToGroup(groupId, payload) {
        return this.groupsService.assignRolesToGroup(groupId, payload.roles);
    }
    async handlerRemoveRolesFromGroup(groupId, payload) {
        return this.groupsService.removeRolesFromGroup(groupId, payload.roles);
    }
};
exports.AuthGroupsController = AuthGroupsController;
tslib_1.__decorate([
    (0, http_1.Get)('group-get-all', {
        contract: groups_contract_1.GroupsContract,
        schema: http_1.RouterSchema.GetAll,
        summary: 'Returns the list with all groups in the system',
        exposeFilters: false,
        exclude: true,
    }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], AuthGroupsController.prototype, "handlerGroupGetAll", null);
tslib_1.__decorate([
    (0, http_1.Get)('group-get-in', {
        contract: groups_contract_1.GroupsContract,
        schema: http_1.RouterSchema.GetIn,
        exclude: true,
    }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Query)('ids')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthGroupsController.prototype, "handlerGroupGetIn", null);
tslib_1.__decorate([
    (0, http_1.Post)('group-create', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthGroupsController.prototype, "handlerCreateGroup", null);
tslib_1.__decorate([
    (0, http_1.Put)('group-update/:groupId', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('groupId')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthGroupsController.prototype, "handlerUpdateGroup", null);
tslib_1.__decorate([
    (0, http_1.Delete)('group-delete/:groupId', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('groupId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthGroupsController.prototype, "handlerDeleteGroup", null);
tslib_1.__decorate([
    (0, http_1.Put)('group-assign-roles/:groupId', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('groupId')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthGroupsController.prototype, "handlerAssignRolesToGroup", null);
tslib_1.__decorate([
    (0, http_1.Put)('group-remove-roles/:groupId', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('groupId')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthGroupsController.prototype, "handlerRemoveRolesFromGroup", null);
exports.AuthGroupsController = AuthGroupsController = tslib_1.__decorate([
    (0, http_1.Controller)('auth'),
    tslib_1.__metadata("design:paramtypes", [groups_service_1.AuthGroupsService])
], AuthGroupsController);
