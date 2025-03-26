"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthOPTController = void 0;
const tslib_1 = require("tslib");
const http_1 = require("@cmmv/http");
const opt_service_1 = require("../services/opt.service");
let AuthOPTController = class AuthOPTController {
    constructor(optService) {
        this.optService = optService;
    }
    async handlerGenerateOptSecret(token) {
        return this.optService.generateOptSecret(token);
    }
    async handlerEnable2FA(token, payload) {
        return this.optService.updateOptSecret(token, payload?.secret);
    }
    async handlerRemoveOptSecret(token, payload) {
        return this.optService.removeOptSecret(token, payload?.secret);
    }
    async handlerValidateOptSecret(token, payload) {
        return this.optService.validateOptSecret(token, payload?.secret);
    }
};
exports.AuthOPTController = AuthOPTController;
tslib_1.__decorate([
    (0, http_1.Get)('opt-qrcode', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Header)('authorization')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthOPTController.prototype, "handlerGenerateOptSecret", null);
tslib_1.__decorate([
    (0, http_1.Put)('opt-enable', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Header)('authorization')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthOPTController.prototype, "handlerEnable2FA", null);
tslib_1.__decorate([
    (0, http_1.Delete)('opt-disable', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Header)('authorization')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthOPTController.prototype, "handlerRemoveOptSecret", null);
tslib_1.__decorate([
    (0, http_1.Post)('opt-validate', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Header)('authorization')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthOPTController.prototype, "handlerValidateOptSecret", null);
exports.AuthOPTController = AuthOPTController = tslib_1.__decorate([
    (0, http_1.Controller)('auth'),
    tslib_1.__metadata("design:paramtypes", [opt_service_1.AuthOptService])
], AuthOPTController);
