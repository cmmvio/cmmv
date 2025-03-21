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
    controllerName: 'User',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: true,
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
        afterValidation: (value) =>
            crypto.createHash('sha1').update(value).digest('hex'),
    })
    username: string;

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
                message: 'Invalid password',
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
                createRelationship: false,
                contract: GroupsContract,
                entityName: 'groups',
                field: '_id',
                array: true,
            },
        ],
    })
    groups: Array<string>;

    @ContractField({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string[]',
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
        functionName: 'login',
        request: 'LoginRequest',
        response: 'LoginResponse',
        createBoilerplate: false,
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
        functionName: 'register',
        request: 'RegisterRequest',
        response: 'RegisterResponse',
        createBoilerplate: false,
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
    })
    RemoveGroupsFromUser: Function;
}
