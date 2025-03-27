import { AbstractContract, Contract, ContractField } from '@cmmv/core';

@Contract({
    namespace: 'Auth',
    controllerName: 'OAuthCodes',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: false,
    auth: false,
    rootOnly: false,
    options: {
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
        nullable: false,
        index: true,
    })
    clientId: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    useId: string;

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
