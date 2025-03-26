"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultContract = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
let VaultContract = class VaultContract extends core_1.AbstractContract {
};
exports.VaultContract = VaultContract;
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", String)
], VaultContract.prototype, "key", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", String)
], VaultContract.prototype, "payload", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", String)
], VaultContract.prototype, "iv", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", String)
], VaultContract.prototype, "tag", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", String)
], VaultContract.prototype, "ephemeral", void 0);
exports.VaultContract = VaultContract = tslib_1.__decorate([
    (0, core_1.Contract)({
        namespace: 'Vault',
        controllerName: 'Vault',
        protoPackage: 'vault',
        generateController: false,
        generateEntities: true,
        auth: true,
        options: {
            moduleContract: true,
            databaseSchemaName: 'vault_secrets',
            databaseTimestamps: true,
            databaseUserAction: false,
        },
    })
], VaultContract);
