import {
    AbstractContract,
    Contract,
    ContractField,
    ContractMessage,
    ContractService,
} from '@cmmv/core';

@Contract({
    controllerName: 'Groups',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: true,
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
        name: 'GroupRolesPayload',
        properties: {
            roles: {
                type: 'simpleArray',
                arrayType: 'string',
                paramType: 'body',
                required: true,
            },
        },
    })
    GroupRolesPayload: {
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
        functionName: 'handlerGroupGetIn',
        request: '',
        response: 'GroupResponse',
        createBoilerplate: false,
    })
    GroupGetIn: Function;

    @ContractService({
        name: 'GroupCreate',
        path: 'auth/group-create',
        method: 'POST',
        auth: true,
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
        functionName: 'handlerUpdateGroup',
        request: 'GroupPayload',
        response: 'GroupResponse',
        createBoilerplate: false,
    })
    GroupUpdate: Function;

    @ContractService({
        name: 'GroupDelete',
        path: 'auth/group-delete/:groupId',
        method: 'DELETE',
        auth: true,
        functionName: 'handlerDeleteGroup',
        request: '',
        response: 'GroupResponse',
        createBoilerplate: false,
    })
    GroupDelete: Function;

    @ContractService({
        name: 'GroupAssignRoles',
        path: 'auth/group-assign-roles/:groupId',
        method: 'PUT',
        auth: true,
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
        functionName: 'handlerRemoveRolesFromGroup',
        request: 'GroupRolesPayload',
        response: 'GroupResponse',
        createBoilerplate: false,
    })
    GroupRemoveRoles: Function;
}
