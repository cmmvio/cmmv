import { AbstractContract, Contract, ContractField } from '@cmmv/core';

@Contract({
    controllerName: 'Groups',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: true,
    auth: true,
    rootOnly: true,
    options: {
        moduleContract: true,
        databaseSchemaName: 'auth_groups',
        databaseTimestamps: true,
        databaseUserAction: true,
    },
})
export class GroupsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: false,
        validations: [
            {
                type: 'IsString',
                message: 'Invalid name',
            },
            {
                type: 'MinLength',
                value: 3,
                message: 'Invalid name',
            },
            {
                type: 'MaxLength',
                value: 40,
                message: 'Invalid name',
            },
        ],
    })
    name: string;

    @ContractField({
        protoType: 'string',
        defaultValue: '[]',
        objectType: 'string[]',
        protoRepeated: true,
        nullable: true,
    })
    roles: string[];
}
