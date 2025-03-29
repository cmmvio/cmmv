import {
    AbstractContract,
    Contract,
    ContractField,
    ContractMessage,
    ContractService,
} from '@cmmv/core';

@Contract({
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
export class GroupsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: false,
        validations: [
            {
                type: 'IsString',
                message: 'The name must be a string',
            },
            {
                type: 'MinLength',
                value: 3,
                message: 'The name must be at least 3 characters',
            },
            {
                type: 'MaxLength',
                value: 40,
                message: 'The name must be less than 40 characters',
            },
        ],
    })
    name: string;

    @ContractField({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string[]',
        protoRepeated: true,
        nullable: true,
        readOnly: true,
    })
    roles: string[];

    @ContractMessage({
        name: 'GroupPayload',
        properties: {
            name: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    })
    GroupPayload: {
        name: string;
    };

    @ContractMessage({
        name: 'GroupUpdatePayload',
        properties: {
            groupId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
            name: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    })
    GroupUpdatePayload: {
        groupId: string;
        name: string;
    };

    @ContractMessage({
        name: 'GroupDeletePayload',
        properties: {
            groupId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
        },
    })
    GroupDeletePayload: {
        groupId: string;
    };

    @ContractMessage({
        name: 'GroupGetInQuery',
        properties: {
            ids: {
                type: 'simpleArray',
                arrayType: 'string',
                paramType: 'query',
                required: true,
            },
        },
    })
    GroupGetInQuery: {
        ids: string[] | string;
    };

    @ContractMessage({
        name: 'GroupRolesPayload',
        properties: {
            groupId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
            roles: {
                type: 'simpleArray',
                arrayType: 'string',
                paramType: 'body',
                required: true,
            },
        },
    })
    GroupRolesPayload: {
        groupId: string;
        roles: string[];
    };

    @ContractMessage({
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
    })
    GroupResponse: {
        success: boolean;
        message?: string;
        data?: any;
    };

    @ContractService({
        name: 'GroupGetAll',
        path: 'auth/group-get-all',
        method: 'GET',
        auth: true,
        rootOnly: true,
        functionName: 'handlerGroupGetAll',
        request: '',
        response: 'GroupResponse',
        createBoilerplate: false,
    })
    GroupGetAll: Function;

    @ContractService({
        name: 'GroupGetIn',
        path: 'auth/group-get-in',
        method: 'GET',
        auth: true,
        rootOnly: true,
        functionName: 'handlerGroupGetIn',
        request: 'GroupGetInQuery',
        response: 'GroupResponse',
        createBoilerplate: false,
    })
    GroupGetIn: Function;

    @ContractService({
        name: 'GroupCreate',
        path: 'auth/group-create',
        method: 'POST',
        auth: true,
        rootOnly: true,
        functionName: 'handlerCreateGroup',
        request: 'GroupPayload',
        response: 'GroupResponse',
        createBoilerplate: false,
    })
    GroupCreate: Function;

    @ContractService({
        name: 'GroupUpdate',
        path: 'auth/group-update/:groupId',
        method: 'PUT',
        auth: true,
        rootOnly: true,
        functionName: 'handlerUpdateGroup',
        request: 'GroupUpdatePayload',
        response: 'GroupResponse',
        createBoilerplate: false,
    })
    GroupUpdate: Function;

    @ContractService({
        name: 'GroupDelete',
        path: 'auth/group-delete/:groupId',
        method: 'DELETE',
        auth: true,
        rootOnly: true,
        functionName: 'handlerDeleteGroup',
        request: 'GroupDeletePayload',
        response: 'GroupResponse',
        createBoilerplate: false,
    })
    GroupDelete: Function;

    @ContractService({
        name: 'GroupAssignRoles',
        path: 'auth/group-assign-roles/:groupId',
        method: 'PUT',
        auth: true,
        rootOnly: true,
        functionName: 'handlerAssignRolesToGroup',
        request: 'GroupRolesPayload',
        response: 'GroupResponse',
        createBoilerplate: false,
    })
    GroupAssignRoles: Function;

    @ContractService({
        name: 'GroupRemoveRoles',
        path: 'auth/group-remove-roles/:groupId',
        method: 'PUT',
        auth: true,
        rootOnly: true,
        functionName: 'handlerRemoveRolesFromGroup',
        request: 'GroupRolesPayload',
        response: 'GroupResponse',
        createBoilerplate: false,
    })
    GroupRemoveRoles: Function;
}
