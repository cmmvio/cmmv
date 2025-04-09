import * as crypto from 'crypto';

import {
    AbstractContract,
    Contract,
    ContractField,
    ContractMessage,
    ContractService,
} from '@cmmv/core';

import { GroupsContract } from './groups.contract';

@Contract({
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
export class UserContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        unique: true,
        validations: [
            {
                type: 'IsString',
                message: 'The username must be a string',
            },
            {
                type: 'MinLength',
                value: 4,
                message: 'The username must be at least 4 characters',
            },
            {
                type: 'MaxLength',
                value: 40,
                message: 'The username must be less than 40 characters',
            },
        ],
        afterValidation: (value) =>
            crypto.createHash('sha1').update(value).digest('hex'),
    })
    username: string;

    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: true,
        validations: [
            {
                type: 'IsEmail',
            },
        ],
    })
    email: string;

    @ContractField({
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
                message: 'The password must be a string',
            },
        ],
        afterValidation: (value) =>
            crypto.createHash('sha256').update(value).digest('hex'),
    })
    password: string;

    @ContractField({
        protoType: 'string',
        index: true,
        nullable: true,
        readOnly: true,
    })
    provider?: string;

    @ContractField({
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
                createRelationship: true,
                contract: GroupsContract,
                entityName: 'groups',
                field: 'id',
                array: true,
            },
        ],
    })
    groups: Array<string>;

    @ContractField({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string',
        entityType: 'simple-array',
        protoRepeated: true,
        nullable: true,
        readOnly: true,
    })
    roles: Array<string>;

    @ContractField({
        protoType: 'bool',
        defaultValue: false,
        exclude: true,
        readOnly: true,
    })
    root: boolean;

    @ContractField({
        protoType: 'bool',
        index: true,
        defaultValue: false,
        toPlainOnly: true,
        readOnly: true,
    })
    blocked: boolean;

    @ContractField({
        protoType: 'bool',
        index: true,
        defaultValue: false,
        readOnly: true,
    })
    validated: boolean;

    @ContractField({
        protoType: 'bool',
        defaultValue: false,
        readOnly: true,
    })
    verifyEmail: boolean;

    @ContractField({
        protoType: 'int32',
        nullable: true,
        exclude: true,
        toPlainOnly: true,
        readOnly: true,
    })
    verifyEmailCode: number;

    @ContractField({
        protoType: 'bool',
        defaultValue: false,
        readOnly: true,
    })
    verifySMS: boolean;

    @ContractField({
        protoType: 'int32',
        nullable: true,
        exclude: true,
        toPlainOnly: true,
        readOnly: true,
    })
    verifySMSCode: number;

    @ContractField({
        protoType: 'string',
        nullable: true,
        exclude: true,
        toPlainOnly: true,
        readOnly: true,
    })
    optSecret: string;

    @ContractField({
        protoType: 'bool',
        defaultValue: false,
        exclude: true,
        toPlainOnly: true,
        readOnly: true,
    })
    optSecretVerify: boolean;

    @ContractField({
        protoType: 'string',
        objectType: 'string',
        defaultValue: "'{}'",
        nullable: true,
        transform: ({ value }) =>
            value === 'object' ? JSON.stringify(value) : '{}',
        toPlain: ({ value }) => (value === 'string' ? JSON.parse(value) : {}),
    })
    profile: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    forgotPasswordToken: string;

    @ContractField({
        protoType: 'int32',
        nullable: true,
        readOnly: true,
    })
    forgotSendAt: number;

    @ContractField({
        protoType: 'bool',
        nullable: true,
        readOnly: true,
        defaultValue: false,
    })
    unsubscribeNewsletter: boolean;

    // Login
    @ContractMessage({
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
    })
    LoginRequest: {
        username: string;
        password: string;
    };

    @ContractMessage({
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
    })
    LoginResponse: {
        success: boolean;
        token: string;
        message: string;
    };

    @ContractService({
        name: 'Login',
        path: 'auth/login',
        method: 'POST',
        auth: false,
        functionName: 'loginGraphQL',
        request: 'LoginRequest',
        response: 'LoginResponse',
        createBoilerplate: false,
        module: '@cmmv/auth',
        serviceName: 'AuthAutorizationService',
    })
    Login: Function;

    //Register
    @ContractMessage({
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
    })
    RegisterRequest: {
        username: string;
        email: string;
        password: string;
    };

    @ContractMessage({
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
    })
    RegisterResponse: {
        success: boolean;
        message: string;
    };

    @ContractService({
        name: 'Register',
        path: 'auth/register',
        method: 'POST',
        auth: false,
        functionName: 'registerGraphQL',
        request: 'RegisterRequest',
        response: 'RegisterResponse',
        createBoilerplate: false,
        module: '@cmmv/auth',
        serviceName: 'AuthAutorizationService',
    })
    Register: Function;

    // Current User
    @ContractMessage({
        name: 'GetCurrentUserRequest',
        properties: {},
    })
    GetCurrentUserRequest: Record<string, never>;

    @ContractMessage({
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
    })
    GetCurrentUserResponse: {
        id: string;
        username: string;
        roles?: any;
        groups?: any;
        profile?: any;
    };

    @ContractService({
        name: 'GetCurrentUser',
        path: 'auth/user',
        method: 'GET',
        auth: true,
        functionName: 'user',
        request: 'GetCurrentUserRequest',
        response: 'GetCurrentUserResponse',
        createBoilerplate: false,
        module: '@cmmv/auth',
        serviceName: 'AuthAutorizationService',
    })
    GetCurrentUser: Function;

    // Block User
    @ContractMessage({
        name: 'BlockUserRequest',
        properties: {
            userId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
        },
    })
    BlockUserRequest: {
        userId: string;
    };

    @ContractMessage({
        name: 'BlockUserResponse',
        properties: {
            message: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    })
    BlockUserResponse: {
        message: string;
    };

    @ContractService({
        name: 'BlockUser',
        path: 'auth/user-block/:userId',
        method: 'PUT',
        auth: true,
        functionName: 'handlerBlockUser',
        request: 'BlockUserRequest',
        response: 'BlockUserResponse',
        createBoilerplate: false,
        module: '@cmmv/auth',
        serviceName: 'AuthUsersService',
    })
    BlockUser: Function;

    // Unblock User
    @ContractMessage({
        name: 'UnblockUserRequest',
        properties: {
            userId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
        },
    })
    UnblockUserRequest: {
        userId: string;
    };

    @ContractMessage({
        name: 'UnblockUserResponse',
        properties: {
            message: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    })
    UnblockUserResponse: {
        message: string;
    };

    @ContractService({
        name: 'UnblockUser',
        path: 'auth/user-unblock/:userId',
        method: 'PUT',
        auth: true,
        functionName: 'handlerUnblockUser',
        request: 'UnblockUserRequest',
        response: 'UnblockUserResponse',
        createBoilerplate: false,
        module: '@cmmv/auth',
        serviceName: 'AuthUsersService',
    })
    UnblockUser: Function;

    // Assign Groups to User
    @ContractMessage({
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
    })
    AssignGroupsToUserRequest: {
        userId: string;
        groups: string | string[];
    };

    @ContractMessage({
        name: 'AssignGroupsToUserResponse',
        properties: {
            message: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    })
    AssignGroupsToUserResponse: {
        message: string;
    };

    @ContractService({
        name: 'AssignGroupsToUser',
        path: 'auth/user-assign-to-groups/:userId',
        method: 'PUT',
        auth: true,
        functionName: 'handlerAssignGroupsToUser',
        request: 'AssignGroupsToUserRequest',
        response: 'AssignGroupsToUserResponse',
        createBoilerplate: false,
        module: '@cmmv/auth',
        serviceName: 'AuthUsersService',
    })
    AssignGroupsToUser: Function;

    // Remove Groups from User
    @ContractMessage({
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
    })
    RemoveGroupsFromUserRequest: {
        userId: string;
        groups: string | string[];
    };

    @ContractMessage({
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
    })
    RemoveGroupsFromUserResponse: {
        success: boolean;
        message: string;
    };

    @ContractService({
        name: 'RemoveGroupsFromUser',
        path: 'auth/user-remove-groups/:userId',
        method: 'DELETE',
        auth: true,
        functionName: 'handlerRemoveGroups',
        request: 'RemoveGroupsFromUserRequest',
        response: 'RemoveGroupsFromUserResponse',
        createBoilerplate: false,
        module: '@cmmv/auth',
        serviceName: 'AuthUsersService',
    })
    RemoveGroupsFromUser: Function;
}
