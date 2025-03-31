import { AbstractContract, Contract, ContractField } from '@cmmv/core';

@Contract({
    namespace: 'Repository',
    controllerName: 'Settings',
    protoPackage: 'repository',
    protoPath: 'settings.proto',
    subPath: '/repository',
    generateController: false,
    auth: true,
    expose: false,
    rootOnly: true,
    options: {
        moduleContract: true,
        databaseSchemaName: 'settings',
        databaseTimestamps: true,
    },
})
export class SettingsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    group: string;

    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: false,
    })
    key: string;

    @ContractField({
        protoType: 'text',
        nullable: true,
        readOnly: true,
    })
    value: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        readOnly: true,
    })
    type: string;

    @ContractField({
        protoType: 'string',
        objectType: 'string',
        protoRepeated: true,
        array: true,
        nullable: true,
        readOnly: true,
    })
    flags: Array<string>;
}
