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
})
export class OAuthTokensContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: false,
        index: true,
    })
    accessToken: string;

    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: true,
        index: true,
    })
    refreshToken?: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    clientId: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    userId: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    scope: string;

    @ContractField({
        protoType: 'int64',
        nullable: false,
    })
    expiresAt: number;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    origin: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    referer: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    agent: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    state: string;
}
