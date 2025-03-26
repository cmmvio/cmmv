"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationsContract = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
let MigrationsContract = class MigrationsContract extends core_1.AbstractContract {
};
exports.MigrationsContract = MigrationsContract;
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'int32',
        nullable: false,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", Number)
], MigrationsContract.prototype, "timestamp", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", String)
], MigrationsContract.prototype, "name", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", String)
], MigrationsContract.prototype, "hash", void 0);
exports.MigrationsContract = MigrationsContract = tslib_1.__decorate([
    (0, core_1.Contract)({
        namespace: 'Repository',
        controllerName: 'Migrations',
        controllerCustomPath: 'migrations',
        protoPath: 'migrations.proto',
        protoPackage: 'repository',
        subPath: '/repository',
        generateController: false,
        auth: true,
        expose: false,
        rootOnly: true,
        options: {
            moduleContract: true,
            databaseSchemaName: 'migrations',
        },
    })
], MigrationsContract);
