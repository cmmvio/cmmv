import { AbstractContract, Contract, ContractField } from '@cmmv/core';

import { UserContract } from './users.contract';

import { OAuthClientsContract } from './oauth-clients.contract';

@Contract({
    namespace: 'Auth',
    controllerName: 'OAuthAutorizations',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: false,
    auth: false,
    rootOnly: false,
    options: {
        tags: ['oauth2'],
        moduleContract: true,
        databaseSchemaName: 'auth_oauth_autorizations',
        databaseTimestamps: true,
    },
})
export class OAuthAutorizationsContract extends AbstractContract {
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
        protoType: 'int64',
        nullable: false,
        readOnly: true,
    })
    approvedAt: number;

    @ContractField({
        protoType: 'string',
        nullable: false,
        readOnly: true,
    })
    codeAutorization: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        readOnly: true,
    })
    scope: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        readOnly: true,
        defaultValue: false,
    })
    revoked: boolean;

    @ContractField({
        protoType: 'int64',
        nullable: true,
        readOnly: true,
    })
    revokedAt: number;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    ip: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    location: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    agent: string;
}
