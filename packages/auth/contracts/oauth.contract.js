"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuth2Contract = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
let OAuth2Contract = class OAuth2Contract extends core_1.AbstractContract {
};
exports.OAuth2Contract = OAuth2Contract;
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'AuthorizationRequest',
        properties: {
            response_type: { type: 'string', required: true },
            client_id: { type: 'string', required: true },
            redirect_uri: { type: 'string', required: true },
            scope: { type: 'string', required: false },
            state: { type: 'string', required: false },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], OAuth2Contract.prototype, "AuthorizationRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'AuthorizationResponse',
        properties: {
            code: { type: 'string', required: true },
            state: { type: 'string', required: false },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], OAuth2Contract.prototype, "AuthorizationResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'Authorize',
        path: 'authorize',
        method: 'GET',
        auth: false,
        functionName: 'authorize',
        request: 'AuthorizationRequest',
        response: 'AuthorizationResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], OAuth2Contract.prototype, "Authorize", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'TokenRequest',
        properties: {
            grant_type: { type: 'string', required: true },
            code: { type: 'string', required: false },
            refresh_token: { type: 'string', required: false },
            client_id: { type: 'string', required: true },
            client_secret: { type: 'string', required: true },
            redirect_uri: { type: 'string', required: false },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], OAuth2Contract.prototype, "TokenRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'TokenResponse',
        properties: {
            access_token: { type: 'string', required: true },
            token_type: { type: 'string', required: true, default: 'Bearer' },
            expires_in: { type: 'int', required: true },
            refresh_token: { type: 'string', required: false },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], OAuth2Contract.prototype, "TokenResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'Token',
        path: 'token',
        method: 'POST',
        auth: false,
        functionName: 'token',
        request: 'TokenRequest',
        response: 'TokenResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], OAuth2Contract.prototype, "Token", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'TokenValidationRequest',
        properties: {
            token: { type: 'string', required: true },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], OAuth2Contract.prototype, "TokenValidationRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'TokenValidationResponse',
        properties: {
            valid: { type: 'bool', required: true },
            user_id: { type: 'string', required: false },
            expires_in: { type: 'int', required: false },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], OAuth2Contract.prototype, "TokenValidationResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'ValidateToken',
        path: 'validate',
        method: 'GET',
        auth: true,
        functionName: 'validateToken',
        request: 'TokenValidationRequest',
        response: 'TokenValidationResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], OAuth2Contract.prototype, "ValidateToken", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'TokenRevocationRequest',
        properties: {
            token: { type: 'string', required: true },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], OAuth2Contract.prototype, "TokenRevocationRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'TokenRevocationResponse',
        properties: {
            success: { type: 'bool', required: true },
            message: { type: 'string', required: false },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], OAuth2Contract.prototype, "TokenRevocationResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'RevokeToken',
        path: 'revoke',
        method: 'DELETE',
        auth: true,
        functionName: 'revokeToken',
        request: 'TokenRevocationRequest',
        response: 'TokenRevocationResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], OAuth2Contract.prototype, "RevokeToken", void 0);
exports.OAuth2Contract = OAuth2Contract = tslib_1.__decorate([
    (0, core_1.Contract)({
        namespace: 'Auth',
        controllerName: 'OAuth2',
        protoPackage: 'auth',
        subPath: '/auth',
        generateController: false,
        auth: false,
        rootOnly: false,
        options: {
            tags: ['oauth2'],
            moduleContract: true,
            databaseSchemaName: 'auth_oauth2',
            databaseTimestamps: true,
        },
    })
], OAuth2Contract);
