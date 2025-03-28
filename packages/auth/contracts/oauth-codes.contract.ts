import { AbstractContract, Contract, ContractField } from '@cmmv/core';

import { OAuthClientsContract } from './oauth-clients.contract';

import { UserContract } from './users.contract';

@Contract({
    namespace: 'Auth',
    controllerName: 'OAuthCodes',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: false,
    auth: false,
    rootOnly: false,
    options: {
        tags: ['oauth2'],
        moduleContract: true,
        databaseSchemaName: 'auth_oauth_codes',
        databaseTimestamps: true,
    },
    index: [{ name: 'idx_code', fields: ['code'] }],
})
export class OAuthCodesContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: false,
        index: true,
    })
    code: string;

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
    redirectUri: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
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
        index: true,
    })
    state: string;

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
}
