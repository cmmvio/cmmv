"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsContract = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
const users_contract_1 = require("./users.contract");
let SessionsContract = class SessionsContract extends core_1.AbstractContract {
};
exports.SessionsContract = SessionsContract;
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
        index: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", String)
], SessionsContract.prototype, "uuid", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
        unique: true,
        index: true,
        exclude: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", String)
], SessionsContract.prototype, "fingerprint", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        objectType: 'object',
        entityType: 'UserEntity',
        protoRepeated: false,
        nullable: false,
        index: true,
        exclude: true,
        readOnly: true,
        link: [
            {
                contract: users_contract_1.UserContract,
                contractName: 'UserContract',
                entityName: 'user',
                field: '_id',
            },
        ],
    }),
    tslib_1.__metadata("design:type", String)
], SessionsContract.prototype, "user", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", String)
], SessionsContract.prototype, "ipAddress", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", String)
], SessionsContract.prototype, "device", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", String)
], SessionsContract.prototype, "browser", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", String)
], SessionsContract.prototype, "os", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'bool',
        nullable: false,
        defaultValue: false,
    }),
    tslib_1.__metadata("design:type", Boolean)
], SessionsContract.prototype, "revoked", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", String)
], SessionsContract.prototype, "userAgent", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: false,
        exclude: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", String)
], SessionsContract.prototype, "refreshToken", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'GetSessionsRequest',
        properties: {
            limit: {
                type: 'int',
                paramType: 'query',
                required: false,
            },
            offset: {
                type: 'int',
                paramType: 'query',
                required: false,
            },
            sortBy: {
                type: 'string',
                paramType: 'query',
                required: false,
            },
            sort: {
                type: 'string',
                paramType: 'query',
                required: false,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], SessionsContract.prototype, "GetSessionsRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'GetSessionsResponse',
        properties: {
            data: {
                type: 'any',
                paramType: 'body',
                required: true,
            },
            count: {
                type: 'int',
                paramType: 'body',
                required: true,
            },
            total: {
                type: 'int',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], SessionsContract.prototype, "GetSessionsResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'GetSessions',
        path: '/sessions',
        method: 'GET',
        auth: true,
        functionName: 'getSessions',
        request: 'GetSessionsRequest',
        response: 'GetSessionsResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], SessionsContract.prototype, "GetSessions", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'ValidateSessionRequest',
        properties: {
            token: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], SessionsContract.prototype, "ValidateSessionRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'ValidateSessionResponse',
        properties: {
            valid: {
                type: 'bool',
                paramType: 'body',
                required: true,
            },
            user: {
                type: 'any',
                paramType: 'body',
                required: false,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], SessionsContract.prototype, "ValidateSessionResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'ValidateSession',
        path: 'sessions/validate',
        method: 'POST',
        auth: false,
        functionName: 'validateSession',
        request: 'ValidateSessionRequest',
        response: 'ValidateSessionResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], SessionsContract.prototype, "ValidateSession", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'RevokeSessionRequest',
        properties: {
            sessionId: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], SessionsContract.prototype, "RevokeSessionRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'RevokeSessionResponse',
        properties: {
            success: {
                type: 'bool',
                paramType: 'body',
                required: true,
            },
            message: {
                type: 'string',
                paramType: 'body',
                required: false,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], SessionsContract.prototype, "RevokeSessionResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'RevokeSession',
        path: 'sessions/revoke',
        method: 'POST',
        auth: true,
        functionName: 'revokeSession',
        request: 'RevokeSessionRequest',
        response: 'RevokeSessionResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], SessionsContract.prototype, "RevokeSession", void 0);
exports.SessionsContract = SessionsContract = tslib_1.__decorate([
    (0, core_1.Contract)({
        namespace: 'Auth',
        controllerName: 'Sessions',
        protoPackage: 'auth',
        subPath: '/auth',
        generateController: false,
        options: {
            moduleContract: true,
            databaseSchemaName: 'auth_sessions',
            databaseTimestamps: true,
        },
    })
], SessionsContract);
