import { AbstractContract, Contract, ContractField } from '@cmmv/core';

@Contract({
    namespace: 'Vault',
    controllerName: 'Vault',
    protoPackage: 'vault',
    generateController: false,
    generateEntities: true,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: 'vault_secrets',
        databaseTimestamps: true,
        databaseUserAction: false,
    },
})
export class VaultContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    key: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    payload: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    iv: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    tag: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    ephemeral: string;
}
