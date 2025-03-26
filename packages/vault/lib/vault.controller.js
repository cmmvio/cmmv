"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultController = void 0;
const tslib_1 = require("tslib");
const http_1 = require("@cmmv/http");
const vault_service_1 = require("./vault.service");
const auth_1 = require("@cmmv/auth");
let VaultController = class VaultController {
    constructor(vaultService) {
        this.vaultService = vaultService;
    }
    async handlerInsertPayload(data) {
        return this.vaultService.insert(data.key, data.payload);
    }
    async handlerGetPayload(key) {
        return this.vaultService.get(key);
    }
    async handlerDeleteKey(key) {
        return this.vaultService.remove(key);
    }
};
exports.VaultController = VaultController;
tslib_1.__decorate([
    (0, http_1.Post)({ exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], VaultController.prototype, "handlerInsertPayload", null);
tslib_1.__decorate([
    (0, http_1.Get)(':key', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('key')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], VaultController.prototype, "handlerGetPayload", null);
tslib_1.__decorate([
    (0, http_1.Delete)(':key', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('key')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], VaultController.prototype, "handlerDeleteKey", null);
exports.VaultController = VaultController = tslib_1.__decorate([
    (0, http_1.Controller)('vault'),
    tslib_1.__metadata("design:paramtypes", [vault_service_1.VaultService])
], VaultController);
