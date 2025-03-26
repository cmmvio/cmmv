"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSError = exports.WSContract = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
let WSContract = class WSContract extends core_1.AbstractContract {
};
exports.WSContract = WSContract;
tslib_1.__decorate([
    (0, core_1.ContractField)({ protoType: 'int32' }),
    tslib_1.__metadata("design:type", Number)
], WSContract.prototype, "contract", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({ protoType: 'int32' }),
    tslib_1.__metadata("design:type", Number)
], WSContract.prototype, "message", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({ protoType: 'bytes' }),
    tslib_1.__metadata("design:type", Uint8Array)
], WSContract.prototype, "data", void 0);
exports.WSContract = WSContract = tslib_1.__decorate([
    (0, core_1.Contract)({
        controllerName: 'WsCall',
        protoPath: 'src/protos/ws.proto',
        protoPackage: 'ws',
        directMessage: true,
        generateController: false,
        generateEntities: false,
        options: {
            moduleContract: true,
        },
    })
], WSContract);
let WSError = class WSError extends core_1.AbstractContract {
};
exports.WSError = WSError;
tslib_1.__decorate([
    (0, core_1.ContractField)({ protoType: 'string' }),
    tslib_1.__metadata("design:type", String)
], WSError.prototype, "message", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({ protoType: 'int32' }),
    tslib_1.__metadata("design:type", Number)
], WSError.prototype, "code", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({ protoType: 'string' }),
    tslib_1.__metadata("design:type", String)
], WSError.prototype, "context", void 0);
exports.WSError = WSError = tslib_1.__decorate([
    (0, core_1.Contract)({
        controllerName: 'WsError',
        protoPath: 'src/protos/wserror.proto',
        protoPackage: 'wserror',
        directMessage: true,
        generateController: false,
        generateEntities: false,
        options: {
            moduleContract: true,
        },
    })
], WSError);
