"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthTokensContract = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
let OAuthTokensContract = class OAuthTokensContract extends core_1.AbstractContract {
};
exports.OAuthTokensContract = OAuthTokensContract;
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        unique: true,
        nullable: false,
        index: true,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthTokensContract.prototype, "access_token", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        unique: true,
        nullable: true,
        index: true,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthTokensContract.prototype, "refresh_token", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
        index: true,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthTokensContract.prototype, "client_id", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
        index: true,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthTokensContract.prototype, "user_id", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthTokensContract.prototype, "scope", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'int64',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", Number)
], OAuthTokensContract.prototype, "expires_at", void 0);
exports.OAuthTokensContract = OAuthTokensContract = tslib_1.__decorate([
    (0, core_1.Contract)({
        namespace: 'Auth',
        controllerName: 'OAuthTokens',
        protoPackage: 'auth',
        subPath: '/auth',
        generateController: false,
        auth: false,
        rootOnly: false,
        options: {
            moduleContract: true,
            databaseSchemaName: 'auth_oauth_tokens',
            databaseTimestamps: true,
        },
        index: [
            { name: 'idx_token', fields: ['access_token'] },
            { name: 'idx_refresh_token', fields: ['refresh_token'] },
        ],
    })
], OAuthTokensContract);
