import {
    AbstractContract,
    Contract,
    ContractField,
    ContractMessage,
    ContractService,
} from '@cmmv/core';

@Contract({
    namespace: 'Auth',
    controllerName: 'OAuthClients',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: false,
    auth: false,
    rootOnly: false,
    options: {
        tags: ['oauth2'],
        moduleContract: true,
        databaseSchemaName: 'auth_oauth_clients',
        databaseTimestamps: true,
    },
})
export class OAuthClientsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    clientName: string;

    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: false,
        index: true,
    })
    clientId: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    clientSecret: string;

    @ContractField({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string',
        protoRepeated: true,
        nullable: true,
        readOnly: true,
    })
    redirectUris: string[];

    @ContractField({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string',
        protoRepeated: true,
        nullable: true,
        readOnly: true,
    })
    allowedScopes: string[];

    @ContractField({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string',
        protoRepeated: true,
        nullable: true,
        readOnly: true,
    })
    allowedGrantTypes: string[];

    @ContractField({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string',
        protoRepeated: true,
        nullable: true,
        readOnly: true,
    })
    authorizedDomains: string[];

    @ContractField({
        protoType: 'bool',
        defaultValue: true,
    })
    isActive: boolean;

    @ContractField({
        protoType: 'int32',
        nullable: false,
    })
    accessTokenLifetime: number;

    @ContractField({
        protoType: 'int32',
        nullable: false,
    })
    refreshTokenLifetime: number;

    // Common Response structure
    @ContractMessage({
        name: 'OAuthClientsResponse',
        properties: {
            success: {
                type: 'bool',
                required: true,
            },
            message: {
                type: 'string',
                required: false,
            },
            result: {
                type: 'any',
                required: false,
            },
        },
    })
    OAuthClientsResponse: {
        success: boolean;
        message?: string;
        result?: any;
    };

    // Get All Clients
    @ContractMessage({
        name: 'OAuthClientsGetAllRequest',
        properties: {},
    })
    OAuthClientsGetAllRequest: Record<string, never>;

    @ContractService({
        name: 'ClientsGetAll',
        path: 'oauth/clients',
        method: 'GET',
        auth: true,
        rootOnly: true,
        request: 'OAuthClientsGetAllRequest',
        response: 'OAuthClientsResponse',
        functionName: 'OAuthClientsGetAll',
    })
    OAuthClientsGetAll: Function;

    // Get Client By Id
    @ContractMessage({
        name: 'OAuthClientsGetByIdRequest',
        properties: {
            clientId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
        },
    })
    OAuthClientsGetByIdRequest: {
        clientId: string;
    };

    @ContractService({
        name: 'ClientsGetById',
        path: 'oauth/client/:clientId',
        method: 'GET',
        auth: true,
        rootOnly: false,
        request: 'OAuthClientsGetByIdRequest',
        response: 'OAuthClientsResponse',
        functionName: 'OAuthClientsGetById',
    })
    OAuthClientsGetById: Function;

    // Get Client By Id (Admin)
    @ContractMessage({
        name: 'OAuthClientsGetByIdAdminRequest',
        properties: {
            clientId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
        },
    })
    OAuthClientsGetByIdAdminRequest: {
        clientId: string;
    };

    @ContractService({
        name: 'ClientsGetByIdAdmin',
        path: 'oauth/client/admin/:clientId',
        method: 'GET',
        auth: true,
        rootOnly: true,
        request: 'OAuthClientsGetByIdAdminRequest',
        response: 'OAuthClientsResponse',
        functionName: 'OAuthClientsGetByIdAdmin',
    })
    OAuthClientsGetByIdAdmin: Function;

    // Create Client
    @ContractMessage({
        name: 'OAuthClientsCreateRequest',
        properties: {
            clientName: {
                type: 'string',
                required: true,
            },
            redirectUris: {
                type: 'simpleArray',
                arrayType: 'string',
                required: true,
            },
            allowedScopes: {
                type: 'simpleArray',
                arrayType: 'string',
                required: true,
            },
            allowedGrantTypes: {
                type: 'simpleArray',
                arrayType: 'string',
                required: true,
            },
            authorizedDomains: {
                type: 'simpleArray',
                arrayType: 'string',
                required: true,
            },
            isActive: {
                type: 'bool',
                required: false,
            },
            accessTokenLifetime: {
                type: 'int32',
                required: true,
            },
            refreshTokenLifetime: {
                type: 'int32',
                required: true,
            },
        },
    })
    OAuthClientsCreateRequest: {
        clientName: string;
        redirectUris: string[];
        allowedScopes: string[];
        allowedGrantTypes: string[];
        authorizedDomains: string[];
        isActive?: boolean;
        accessTokenLifetime: number;
        refreshTokenLifetime: number;
    };

    @ContractService({
        name: 'ClientsCreate',
        path: 'oauth/client',
        method: 'POST',
        auth: true,
        rootOnly: true,
        request: 'OAuthClientsCreateRequest',
        response: 'OAuthClientsResponse',
        functionName: 'OAuthClientsCreate',
    })
    OAuthClientsCreate: Function;

    // Update Client
    @ContractMessage({
        name: 'OAuthClientsUpdateRequest',
        properties: {
            clientId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
            clientName: {
                type: 'string',
                required: false,
            },
            redirectUris: {
                type: 'simpleArray',
                arrayType: 'string',
                required: false,
            },
            allowedScopes: {
                type: 'simpleArray',
                arrayType: 'string',
                required: false,
            },
            allowedGrantTypes: {
                type: 'simpleArray',
                arrayType: 'string',
                required: false,
            },
            authorizedDomains: {
                type: 'simpleArray',
                arrayType: 'string',
                required: false,
            },
            isActive: {
                type: 'bool',
                required: false,
            },
            accessTokenLifetime: {
                type: 'int32',
                required: false,
            },
            refreshTokenLifetime: {
                type: 'int32',
                required: false,
            },
        },
    })
    OAuthClientsUpdateRequest: {
        clientId: string;
        clientName?: string;
        redirectUris?: string[];
        allowedScopes?: string[];
        allowedGrantTypes?: string[];
        authorizedDomains?: string[];
        isActive?: boolean;
        accessTokenLifetime?: number;
        refreshTokenLifetime?: number;
    };

    @ContractService({
        name: 'ClientsUpdate',
        path: 'oauth/client/:clientId',
        method: 'PUT',
        auth: true,
        rootOnly: true,
        request: 'OAuthClientsUpdateRequest',
        response: 'OAuthClientsResponse',
        functionName: 'OAuthClientsUpdate',
    })
    OAuthClientsUpdate: Function;

    // Delete Client
    @ContractMessage({
        name: 'OAuthClientsDeleteRequest',
        properties: {
            clientId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
        },
    })
    OAuthClientsDeleteRequest: {
        clientId: string;
    };

    @ContractService({
        name: 'ClientsDelete',
        path: 'oauth/client/:clientId',
        method: 'DELETE',
        auth: true,
        rootOnly: true,
        request: 'OAuthClientsDeleteRequest',
        response: 'OAuthClientsResponse',
        functionName: 'OAuthClientsDelete',
    })
    OAuthClientsDelete: Function;
}
