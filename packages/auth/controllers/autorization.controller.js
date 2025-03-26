"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutorizationController = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
const http_1 = require("@cmmv/http");
const auth_decorator_1 = require("../lib/auth.decorator");
const auth_interface_1 = require("../lib/auth.interface");
const autorization_service_1 = require("../services/autorization.service");
let AutorizationController = class AutorizationController {
    constructor(autorizationService) {
        this.autorizationService = autorizationService;
    }
    async handlerLogin(payload, req, res, session) {
        const localLogin = core_1.Config.get('auth.localLogin', false);
        if (localLogin) {
            const { result } = await this.autorizationService.login(payload, req, res, session);
            return result;
        }
        return false;
    }
    async handlerRegister(payload) {
        const localRegister = core_1.Config.get('auth.localRegister', false);
        if (localRegister)
            return await this.autorizationService.register(payload);
        return false;
    }
    async handlerCheckToken() {
        return { success: true };
    }
    async handlerCheckUsername(payload, res) {
        const exists = await this.autorizationService.checkUsernameExists(payload.username);
        res.type('text/plain').send(exists.toString());
    }
    async handlerRefreshToken(req) {
        return this.autorizationService.refreshToken(req);
    }
    /* Roles */
    async handlerGetRoles() {
        return this.autorizationService.getRoles();
    }
    async handlerAssignRoles(userId, payload) {
        return this.autorizationService.assignRoles(userId, payload.roles);
    }
    async handlerRemoveRoles(userId, payload) {
        return this.autorizationService.removeRoles(userId, payload.roles);
    }
};
exports.AutorizationController = AutorizationController;
tslib_1.__decorate([
    (0, http_1.Post)('login', {
        summary: 'Route to login using username and password, requires release and depends on authorization on the server',
        externalDocs: 'https://cmmv.io/docs/modules/authentication#login',
        docs: {
            body: auth_interface_1.LoginPayloadSchema,
            return: auth_interface_1.LoginReturnSchema,
        },
    }),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__param(1, (0, http_1.Request)()),
    tslib_1.__param(2, (0, http_1.Response)()),
    tslib_1.__param(3, (0, http_1.Session)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object, Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AutorizationController.prototype, "handlerLogin", null);
tslib_1.__decorate([
    (0, http_1.Post)('register', {
        summary: 'Route to register a new public user, requires release depends on authorization on the server',
        externalDocs: 'https://cmmv.io/docs/modules/authentication#user-registration',
        docs: {
            body: auth_interface_1.RegistryPayloadSchema,
            return: auth_interface_1.RegistryReturnSchema,
        },
    }),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AutorizationController.prototype, "handlerRegister", null);
tslib_1.__decorate([
    (0, http_1.Get)('check', {
        summary: 'Check if authentication is still valid',
        docs: {
            return: auth_interface_1.CheckTokenReturnSchema,
        },
    }),
    (0, auth_decorator_1.Auth)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], AutorizationController.prototype, "handlerCheckToken", null);
tslib_1.__decorate([
    (0, http_1.Post)('check-username', {
        summary: 'Checks if the user is already in use',
        docs: {
            body: auth_interface_1.CheckUsernamePayloadSchema,
            return: auth_interface_1.CheckUsernameReturnSchema,
        },
    }),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__param(1, (0, http_1.Response)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AutorizationController.prototype, "handlerCheckUsername", null);
tslib_1.__decorate([
    (0, http_1.Post)('refresh', {
        summary: 'Route to refresh authentication token using refresh token',
        externalDocs: 'https://cmmv.io/docs/modules/authentication#refresh-token',
        docs: {
            headers: auth_interface_1.RefreshTokenHeadersSchema,
            return: auth_interface_1.RefreshTokenReturnSchema,
        },
    }),
    tslib_1.__param(0, (0, http_1.Request)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AutorizationController.prototype, "handlerRefreshToken", null);
tslib_1.__decorate([
    (0, http_1.Get)('roles', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], AutorizationController.prototype, "handlerGetRoles", null);
tslib_1.__decorate([
    (0, http_1.Put)('roles/:userId', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('userId')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AutorizationController.prototype, "handlerAssignRoles", null);
tslib_1.__decorate([
    (0, http_1.Delete)('roles/:userId', { exclude: true }),
    (0, auth_decorator_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('userId')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AutorizationController.prototype, "handlerRemoveRoles", null);
exports.AutorizationController = AutorizationController = tslib_1.__decorate([
    (0, http_1.Controller)('auth'),
    tslib_1.__metadata("design:paramtypes", [autorization_service_1.AuthAutorizationService])
], AutorizationController);
