"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSessionsController = void 0;
const tslib_1 = require("tslib");
const http_1 = require("@cmmv/http");
const sessions_service_1 = require("../services/sessions.service");
const auth_decorator_1 = require("../lib/auth.decorator");
let AuthSessionsController = class AuthSessionsController {
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
    }
    async getSessions(queries, user) {
        return this.sessionsService.getSessions(queries, user);
    }
    async validateSession(body) {
        try {
            const isValid = await sessions_service_1.AuthSessionsService.validateSession(body.token);
            return {
                valid: isValid,
                user: isValid ? this.extractUserFromToken(body.token) : null,
            };
        }
        catch (error) {
            return { valid: false };
        }
    }
    async revokeSession(body, user) {
        try {
            const result = await this.sessionsService.revokeSession(body.sessionId, user);
            return {
                success: true,
                message: 'Session revoked successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to revoke session',
            };
        }
    }
    extractUserFromToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3)
                return null;
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            return {
                id: payload.id,
                username: payload.username,
            };
        }
        catch (error) {
            return null;
        }
    }
};
exports.AuthSessionsController = AuthSessionsController;
tslib_1.__decorate([
    (0, http_1.Get)({ exclude: true }),
    (0, auth_decorator_1.Auth)(),
    tslib_1.__param(0, (0, http_1.Queries)()),
    tslib_1.__param(1, (0, http_1.User)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthSessionsController.prototype, "getSessions", null);
tslib_1.__decorate([
    (0, http_1.Post)('validate'),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthSessionsController.prototype, "validateSession", null);
tslib_1.__decorate([
    (0, http_1.Post)('revoke'),
    (0, auth_decorator_1.Auth)(),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__param(1, (0, http_1.User)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthSessionsController.prototype, "revokeSession", null);
exports.AuthSessionsController = AuthSessionsController = tslib_1.__decorate([
    (0, http_1.Controller)('sessions'),
    tslib_1.__metadata("design:paramtypes", [sessions_service_1.AuthSessionsService])
], AuthSessionsController);
