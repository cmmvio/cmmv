"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthCodesContract = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
let OAuthCodesContract = class OAuthCodesContract extends core_1.AbstractContract {
};
exports.OAuthCodesContract = OAuthCodesContract;
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        unique: true,
        nullable: false,
        index: true,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthCodesContract.prototype, "code", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
        index: true,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthCodesContract.prototype, "client_id", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
        index: true,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthCodesContract.prototype, "user_id", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthCodesContract.prototype, "redirect_uri", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthCodesContract.prototype, "scope", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'int64',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", Number)
], OAuthCodesContract.prototype, "expires_at", void 0);
exports.OAuthCodesContract = OAuthCodesContract = tslib_1.__decorate([
    (0, core_1.Contract)({
        namespace: 'Auth',
        controllerName: 'OAuthCodes',
        protoPackage: 'auth',
        subPath: '/auth',
        generateController: false,
        auth: false,
        rootOnly: false,
        options: {
            moduleContract: true,
            databaseSchemaName: 'auth_oauth_codes',
            databaseTimestamps: true,
        },
        index: [{ name: 'idx_code', fields: ['code'] }],
    })
], OAuthCodesContract);
