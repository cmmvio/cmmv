import { AbstractContract, Contract, ContractField } from '@cmmv/core';

@Contract({
    namespace: 'Auth',
    controllerName: 'OAuthTokens',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: false,
    auth: false,
    rootOnly: false,
    options: {
        moduleContract: true,
        databaseSchemaName: 'auth_oauth_tokens',
        databaseTimestamps: true,
    },
    index: [
        { name: 'idx_token', fields: ['access_token'] },
        { name: 'idx_refresh_token', fields: ['refresh_token'] },
    ],
})
export class OAuthTokensContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: false,
        index: true,
    })
    access_token: string;

    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: true,
        index: true,
    })
    refresh_token?: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    client_id: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    user_id: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    scope: string;

    @ContractField({
        protoType: 'int64',
        nullable: false,
    })
    expires_at: number;
}
