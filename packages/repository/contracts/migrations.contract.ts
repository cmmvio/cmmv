import { AbstractContract, ContractField, Contract } from '@cmmv/core';

@Contract({
    namespace: 'Repository',
    controllerName: 'Migrations',
    controllerCustomPath: 'migrations',
    protoPath: 'migrations.proto',
    protoPackage: 'repository',
    subPath: '/repository',
    generateController: false,
    auth: true,
    expose: false,
    rootOnly: true,
    options: {
        moduleContract: true,
        databaseSchemaName: 'migrations',
    },
})
export class MigrationsContract extends AbstractContract {
    @ContractField({
        protoType: 'int32',
        nullable: false,
        readOnly: true,
    })
    timestamp: number;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    name: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    hash: string;
}
