"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUsersController = void 0;
const tslib_1 = require("tslib");
const http_1 = require("@cmmv/http");
const users_service_1 = require("../services/users.service");
const auth_decorator_1 = require("../lib/auth.decorator");
let AuthUsersController = class AuthUsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async user(user) {
        return user;
    }
    /* Block User */
    async handlerBlockUser(userId) {
        return this.usersService.blockUser(userId);
    }
    async handlerUnblockUser(userId) {
        return this.usersService.unblockUser(userId);
    }
    /* Groups */
    async handlerAssignGroupsToUser(userId, payload) {
        return this.usersService.assignGroupsToUser(userId, payload.groups);
    }
    async handlerRemoveGroups(userId, payload) {
        return this.usersService.removeGroupsFromUser(userId, payload.groups);
    }
};
exports.AuthUsersController = AuthUsersController;
tslib_1.__decorate([
    (0, http_1.Get)('user', { exclude: true }),
    (0, auth_decorator_1.Auth)(),
    tslib_1.__param(0, (0, http_1.User)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthUsersController.prototype, "user", null);
tslib_1.__decorate([
    (0, http_1.Put)('user-block/:userId', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('userId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthUsersController.prototype, "handlerBlockUser", null);
tslib_1.__decorate([
    (0, http_1.Put)('user-unblock/:userId', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('userId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthUsersController.prototype, "handlerUnblockUser", null);
tslib_1.__decorate([
    (0, http_1.Put)('user-assign-to-groups/:userId', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('userId')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthUsersController.prototype, "handlerAssignGroupsToUser", null);
tslib_1.__decorate([
    (0, http_1.Delete)('user-remove-groups/:userId', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('userId')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthUsersController.prototype, "handlerRemoveGroups", null);
exports.AuthUsersController = AuthUsersController = tslib_1.__decorate([
    (0, http_1.Controller)('auth'),
    tslib_1.__metadata("design:paramtypes", [users_service_1.AuthUsersService])
], AuthUsersController);
