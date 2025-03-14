import { AbstractContract, Contract, ContractField } from '@cmmv/core';

import { UserContract } from './users.contract';

@Contract({
    controllerName: 'Sessions',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: false,
    options: {
        moduleContract: true,
        databaseSchemaName: 'auth_sessions',
        databaseTimestamps: true,
    },
})
export class SessionsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        readOnly: true,
    })
    uuid: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        unique: true,
        index: true,
        exclude: true,
        readOnly: true,
    })
    fingerprint: string;

    @ContractField({
        protoType: 'string',
        objectType: 'object',
        entityType: 'UserEntity',
        protoRepeated: false,
        nullable: false,
        index: true,
        exclude: true,
        readOnly: true,
        link: [
            {
                contract: UserContract,
                entityName: 'user',
                field: '_id',
                array: true,
            },
        ],
    })
    user: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        readOnly: true,
    })
    ipAddress: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    device: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    browser: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    os: string;

    @ContractField({
        protoType: 'bool',
        nullable: false,
        defaultValue: false,
    })
    revoked: boolean;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    userAgent: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        exclude: true,
        readOnly: true,
    })
    refreshToken: string;
}
