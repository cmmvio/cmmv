"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsContract = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
let LogsContract = class LogsContract extends core_1.AbstractContract {
};
exports.LogsContract = LogsContract;
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
    }),
    tslib_1.__metadata("design:type", String)
], LogsContract.prototype, "message", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", String)
], LogsContract.prototype, "host", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'int32',
        nullable: false,
        index: true,
    }),
    tslib_1.__metadata("design:type", Number)
], LogsContract.prototype, "timestamp", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", String)
], LogsContract.prototype, "source", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", String)
], LogsContract.prototype, "level", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", String)
], LogsContract.prototype, "file", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        objectType: 'string',
        defaultValue: "'{}'",
        nullable: true,
        transform: ({ value }) => value === 'object' ? JSON.stringify(value) : '{}',
        toPlain: ({ value }) => (value === 'string' ? JSON.parse(value) : {}),
    }),
    tslib_1.__metadata("design:type", String)
], LogsContract.prototype, "event", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        objectType: 'string',
        defaultValue: "'{}'",
        nullable: true,
        transform: ({ value }) => value === 'object' ? JSON.stringify(value) : '{}',
        toPlain: ({ value }) => (value === 'string' ? JSON.parse(value) : {}),
    }),
    tslib_1.__metadata("design:type", String)
], LogsContract.prototype, "metadata", void 0);
exports.LogsContract = LogsContract = tslib_1.__decorate([
    (0, core_1.Contract)({
        namespace: 'Repository',
        controllerName: 'Logs',
        protoPackage: 'repository',
        protoPath: 'logs.proto',
        subPath: '/repository',
        generateController: false,
        auth: true,
        expose: false,
        rootOnly: true,
        options: {
            moduleContract: true,
            databaseSchemaName: 'logs',
        },
    })
], LogsContract);
