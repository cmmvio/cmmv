"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthClientsContract = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
let OAuthClientsContract = class OAuthClientsContract extends core_1.AbstractContract {
};
exports.OAuthClientsContract = OAuthClientsContract;
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        unique: true,
        nullable: false,
        index: true,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthClientsContract.prototype, "client_id", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthClientsContract.prototype, "client_secret", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", Array)
], OAuthClientsContract.prototype, "redirect_uris", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", String)
], OAuthClientsContract.prototype, "scope", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'bool',
        defaultValue: true,
    }),
    tslib_1.__metadata("design:type", Boolean)
], OAuthClientsContract.prototype, "enabled", void 0);
exports.OAuthClientsContract = OAuthClientsContract = tslib_1.__decorate([
    (0, core_1.Contract)({
        namespace: 'Auth',
        controllerName: 'OAuthClients',
        protoPackage: 'auth',
        subPath: '/auth',
        generateController: false,
        auth: false,
        rootOnly: false,
        options: {
            moduleContract: true,
            databaseSchemaName: 'auth_oauth_clients',
            databaseTimestamps: true,
        },
        index: [{ name: 'idx_client', fields: ['client_id'] }],
    })
], OAuthClientsContract);
