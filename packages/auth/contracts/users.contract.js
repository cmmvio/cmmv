"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserContract = void 0;
const tslib_1 = require("tslib");
const crypto = require("crypto");
const core_1 = require("@cmmv/core");
const groups_contract_1 = require("./groups.contract");
let UserContract = class UserContract extends core_1.AbstractContract {
};
exports.UserContract = UserContract;
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        unique: true,
        validations: [
            {
                type: 'IsString',
                message: 'Invalid username',
            },
            {
                type: 'MinLength',
                value: 4,
                message: 'Invalid username',
            },
            {
                type: 'MaxLength',
                value: 40,
                message: 'Invalid username',
            },
        ],
        afterValidation: (value) => crypto.createHash('sha1').update(value).digest('hex'),
    }),
    tslib_1.__metadata("design:type", String)
], UserContract.prototype, "username", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        customDecorator: {
            IsStrongPassword: {
                import: '@cmmv/core',
                options: {
                    message: 'Password must be strong',
                },
            },
        },
        validations: [
            {
                type: 'IsString',
                message: 'Invalid password',
            },
        ],
        afterValidation: (value) => crypto.createHash('sha256').update(value).digest('hex'),
    }),
    tslib_1.__metadata("design:type", String)
], UserContract.prototype, "password", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        index: true,
        nullable: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", String)
], UserContract.prototype, "provider", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        objectType: 'object',
        entityType: 'GroupsEntity',
        protoRepeated: true,
        nullable: true,
        resolver: 'user-groups',
        modelName: 'Groups',
        readOnly: true,
        link: [
            {
                createRelationship: false,
                contract: groups_contract_1.GroupsContract,
                entityName: 'groups',
                field: '_id',
                array: true,
            },
        ],
    }),
    tslib_1.__metadata("design:type", Array)
], UserContract.prototype, "groups", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string[]',
        entityType: 'simple-array',
        protoRepeated: true,
        nullable: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", Array)
], UserContract.prototype, "roles", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'bool',
        defaultValue: false,
        exclude: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", Boolean)
], UserContract.prototype, "root", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'bool',
        index: true,
        defaultValue: false,
        toPlainOnly: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", Boolean)
], UserContract.prototype, "blocked", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'bool',
        index: true,
        defaultValue: false,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", Boolean)
], UserContract.prototype, "validated", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'bool',
        defaultValue: false,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", Boolean)
], UserContract.prototype, "verifyEmail", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'int32',
        nullable: true,
        exclude: true,
        toPlainOnly: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", Number)
], UserContract.prototype, "verifyEmailCode", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'bool',
        defaultValue: false,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", Boolean)
], UserContract.prototype, "verifySMS", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'int32',
        nullable: true,
        exclude: true,
        toPlainOnly: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", Number)
], UserContract.prototype, "verifySMSCode", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'string',
        nullable: true,
        exclude: true,
        toPlainOnly: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", String)
], UserContract.prototype, "optSecret", void 0);
tslib_1.__decorate([
    (0, core_1.ContractField)({
        protoType: 'bool',
        defaultValue: false,
        exclude: true,
        toPlainOnly: true,
        readOnly: true,
    }),
    tslib_1.__metadata("design:type", Boolean)
], UserContract.prototype, "optSecretVerify", void 0);
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
], UserContract.prototype, "profile", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'LoginRequest',
        properties: {
            username: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
            password: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "LoginRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'LoginResponse',
        properties: {
            success: {
                type: 'bool',
                paramType: 'body',
                required: true,
            },
            token: {
                type: 'string',
                paramType: 'body',
                required: false,
            },
            message: {
                type: 'string',
                paramType: 'body',
                required: false,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "LoginResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'Login',
        path: 'auth/login',
        method: 'POST',
        auth: false,
        functionName: 'login',
        request: 'LoginRequest',
        response: 'LoginResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], UserContract.prototype, "Login", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'RegisterRequest',
        properties: {
            username: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
            email: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
            password: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "RegisterRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'RegisterResponse',
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
], UserContract.prototype, "RegisterResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'Register',
        path: 'auth/register',
        method: 'POST',
        auth: false,
        functionName: 'register',
        request: 'RegisterRequest',
        response: 'RegisterResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], UserContract.prototype, "Register", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'GetCurrentUserRequest',
        properties: {},
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "GetCurrentUserRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'GetCurrentUserResponse',
        properties: {
            id: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
            username: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
            roles: {
                type: 'any',
                paramType: 'body',
                required: false,
            },
            groups: {
                type: 'any',
                paramType: 'body',
                required: false,
            },
            profile: {
                type: 'any',
                paramType: 'body',
                required: false,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "GetCurrentUserResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'GetCurrentUser',
        path: 'auth/user',
        method: 'GET',
        auth: true,
        functionName: 'user',
        request: 'GetCurrentUserRequest',
        response: 'GetCurrentUserResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], UserContract.prototype, "GetCurrentUser", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'BlockUserRequest',
        properties: {
            userId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "BlockUserRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'BlockUserResponse',
        properties: {
            message: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "BlockUserResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'BlockUser',
        path: 'auth/user-block/:userId',
        method: 'PUT',
        auth: true,
        functionName: 'handlerBlockUser',
        request: 'BlockUserRequest',
        response: 'BlockUserResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], UserContract.prototype, "BlockUser", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'UnblockUserRequest',
        properties: {
            userId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "UnblockUserRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'UnblockUserResponse',
        properties: {
            message: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "UnblockUserResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'UnblockUser',
        path: 'auth/user-unblock/:userId',
        method: 'PUT',
        auth: true,
        functionName: 'handlerUnblockUser',
        request: 'UnblockUserRequest',
        response: 'UnblockUserResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], UserContract.prototype, "UnblockUser", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'AssignGroupsToUserRequest',
        properties: {
            userId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
            groups: {
                type: 'any',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "AssignGroupsToUserRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'AssignGroupsToUserResponse',
        properties: {
            message: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "AssignGroupsToUserResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'AssignGroupsToUser',
        path: 'auth/user-assign-to-groups/:userId',
        method: 'PUT',
        auth: true,
        functionName: 'handlerAssignGroupsToUser',
        request: 'AssignGroupsToUserRequest',
        response: 'AssignGroupsToUserResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], UserContract.prototype, "AssignGroupsToUser", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'RemoveGroupsFromUserRequest',
        properties: {
            userId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
            groups: {
                type: 'any',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "RemoveGroupsFromUserRequest", void 0);
tslib_1.__decorate([
    (0, core_1.ContractMessage)({
        name: 'RemoveGroupsFromUserResponse',
        properties: {
            success: {
                type: 'bool',
                paramType: 'body',
                required: true,
            },
            message: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    }),
    tslib_1.__metadata("design:type", Object)
], UserContract.prototype, "RemoveGroupsFromUserResponse", void 0);
tslib_1.__decorate([
    (0, core_1.ContractService)({
        name: 'RemoveGroupsFromUser',
        path: 'auth/user-remove-groups/:userId',
        method: 'DELETE',
        auth: true,
        functionName: 'handlerRemoveGroups',
        request: 'RemoveGroupsFromUserRequest',
        response: 'RemoveGroupsFromUserResponse',
        createBoilerplate: false,
    }),
    tslib_1.__metadata("design:type", Function)
], UserContract.prototype, "RemoveGroupsFromUser", void 0);
exports.UserContract = UserContract = tslib_1.__decorate([
    (0, core_1.Contract)({
        namespace: 'Auth',
        controllerName: 'User',
        protoPackage: 'auth',
        subPath: '/auth',
        generateController: true,
        generateBoilerplates: false,
        auth: true,
        rootOnly: true,
        imports: ['crypto'],
        index: [
            {
                name: 'idx_user_login',
                fields: ['username', 'password', 'blocked'],
            },
        ],
        options: {
            tags: ['user'],
            moduleContract: true,
            databaseSchemaName: 'auth_users',
            databaseTimestamps: true,
        },
    })
], UserContract);
