import { AbstractContract, Contract, ContractField } from '@cmmv/core';

import { UserContract } from './users.contract';

import { OAuthClientsContract } from './oauth-clients.contract';

@Contract({
    namespace: 'Auth',
    controllerName: 'OAuthTokens',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: false,
    auth: false,
    rootOnly: false,
    options: {
        tags: ['oauth2'],
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
        objectType: 'object',
        entityType: 'OAuthClientsEntity',
        protoRepeated: false,
        nullable: false,
        index: true,
        exclude: true,
        readOnly: true,
        link: [
            {
                createRelationship: true,
                contract: OAuthClientsContract,
                contractName: 'OAuthClientsContract',
                entityName: 'oauth_clients',
                field: 'id',
            },
        ],
    })
    client: string;

    @ContractField({
        protoType: 'string',
        objectType: 'object',
        nullable: false,
        index: true,
        entityType: 'UserEntity',
        protoRepeated: false,
        exclude: true,
        readOnly: true,
        link: [
            {
                createRelationship: true,
                contract: UserContract,
                contractName: 'UserContract',
                entityName: 'user',
                field: 'id',
            },
        ],
    })
    user: string;

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
