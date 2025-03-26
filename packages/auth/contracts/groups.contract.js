"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsContract = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
let GroupsContract = class GroupsContract extends core_1.AbstractContract {
};
exports.GroupsContract = GroupsContract;
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        unique: true,
        nullable: false,
        validations: [
            {
                type: 'IsString',
                message: 'Invalid name',
            },
            {
                type: 'MinLength',
                value: 3,
                message: 'Invalid name',
            },
            {
                type: 'MaxLength',
                value: 40,
                message: 'Invalid name',
            },
        ],
    }),
    tslib_1.__metadata("design:type", String)
], GroupsContract.prototype, "name", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string[]',
        protoRepeated: true,
        nullable: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", Array)
], GroupsContract.prototype, "roles", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'GroupPayload',
        properties: {
            name: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], GroupsContract.prototype, "GroupPayload", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'GroupRolesPayload',
        properties: {
            roles: {
                type: 'simpleArray',
                arrayType: 'string',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], GroupsContract.prototype, "GroupRolesPayload", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'GroupResponse',
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
            data: {
                type: 'json',
                paramType: 'body',
                required: false,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], GroupsContract.prototype, "GroupResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'GroupGetAll',
        path: 'auth/group-get-all',
        method: 'GET',
        auth: true,
        functionName: 'handlerGroupGetAll',
        request: '',
        response: 'GroupResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], GroupsContract.prototype, "GroupGetAll", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'GroupGetIn',
        path: 'auth/group-get-in',
        method: 'GET',
        auth: true,
        functionName: 'handlerGroupGetIn',
        request: '',
        response: 'GroupResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], GroupsContract.prototype, "GroupGetIn", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'GroupCreate',
        path: 'auth/group-create',
        method: 'POST',
        auth: true,
        functionName: 'handlerCreateGroup',
        request: 'GroupPayload',
        response: 'GroupResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], GroupsContract.prototype, "GroupCreate", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'GroupUpdate',
        path: 'auth/group-update/:groupId',
        method: 'PUT',
        auth: true,
        functionName: 'handlerUpdateGroup',
        request: 'GroupPayload',
        response: 'GroupResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], GroupsContract.prototype, "GroupUpdate", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'GroupDelete',
        path: 'auth/group-delete/:groupId',
        method: 'DELETE',
        auth: true,
        functionName: 'handlerDeleteGroup',
        request: '',
        response: 'GroupResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], GroupsContract.prototype, "GroupDelete", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'GroupAssignRoles',
        path: 'auth/group-assign-roles/:groupId',
        method: 'PUT',
        auth: true,
        functionName: 'handlerAssignRolesToGroup',
        request: 'GroupRolesPayload',
        response: 'GroupResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], GroupsContract.prototype, "GroupAssignRoles", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'GroupRemoveRoles',
        path: 'auth/group-remove-roles/:groupId',
        method: 'PUT',
        auth: true,
        functionName: 'handlerRemoveRolesFromGroup',
        request: 'GroupRolesPayload',
        response: 'GroupResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], GroupsContract.prototype, "GroupRemoveRoles", void 0);
exports.GroupsContract = GroupsContract = tslib_1.__decorate([
    (0, core_1.Contract)({
        namespace: 'Auth',
        controllerName: 'Groups',
        protoPackage: 'auth',
        subPath: '/auth',
        generateController: true,
        generateBoilerplates: false,
        auth: true,
        rootOnly: true,
        options: {
            moduleContract: true,
            databaseSchemaName: 'auth_groups',
            databaseTimestamps: true,
            databaseUserAction: true,
        },
    })
], GroupsContract);
