import { AbstractContract, Contract, ContractField } from '@cmmv/core';

@Contract({
    isPublic: true,
    controllerName: 'Paises',
    generateController: true,
    generateEntities: true,
    auth: true,
    rootOnly: false,
    options: {
        tags: [],
        moduleContract: false,
        databaseTimestamps: false,
        databaseUserAction: false,
        databaseFakeDelete: true,
    },
})
export class PaisesContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        unique: true,
        index: true,
    })
    name: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    iso?: string;
}
