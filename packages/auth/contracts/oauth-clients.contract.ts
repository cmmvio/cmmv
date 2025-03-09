import { AbstractContract, Contract, ContractField } from '@cmmv/core';

@Contract({
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
    index: [{ name: 'idx_client', fields: ['client_id'] }],
})
export class OAuthClientsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: false,
        index: true,
    })
    client_id: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    client_secret: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    redirect_uris: string[];

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    scope: string;

    @ContractField({
        protoType: 'bool',
        defaultValue: true,
    })
    enabled: boolean;
}
