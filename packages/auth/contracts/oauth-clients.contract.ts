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
        objectType: 'string[]',
        protoRepeated: true,
        nullable: true,
        readOnly: true,
    })
    redirectUris: string[];

    @ContractField({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string[]',
        protoRepeated: true,
        nullable: true,
        readOnly: true,
    })
    allowedScopes: string[];

    @ContractField({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string[]',
        protoRepeated: true,
        nullable: true,
        readOnly: true,
    })
    allowedGrantTypes: string[];

    @ContractField({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string[]',
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

    //Get Clients
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
            data: {
                type: 'json',
                required: false,
            },
        },
    })
    OAuthClientsResponse: {
        success: boolean;
        message?: string;
        data?: any;
    };

    @ContractService({
        name: 'OAuthClientsGetAll',
        path: 'oauth/clients',
        method: 'GET',
        auth: true,
        rootOnly: true,
        response: 'OAuthClientsGetAllResponse',
        functionName: 'OAuthClientsGetAll',
    })
    OAuthClientsGetAll: Function;

    //Create Client
    @ContractMessage({
        name: 'OAuthClientsCreateRequest',
        properties: {
            client_name: {
                type: 'string',
                required: true,
            },
            redirect_uris: {
                type: 'simpleArray',
                arrayType: 'string',
                required: true,
            },
            authorized_domains: {
                type: 'simpleArray',
                arrayType: 'string',
                required: true,
            },
            scope: {
                type: 'string',
                required: true,
            },
        },
    })
    OAuthClientsCreateRequest: {
        client_name: string;
        redirect_uris: string[];
        authorized_domains: string[];
        scope: string;
    };

    @ContractService({
        name: 'OAuthClientsCreate',
        path: 'oauth2/client',
        method: 'POST',
        auth: true,
        rootOnly: true,
        request: 'OAuthClientsCreateRequest',
        response: 'OAuthClientsCreateResponse',
        functionName: 'OAuthClientsCreate',
    })
    OAuthClientsCreate: Function;
}
