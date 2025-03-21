import { AbstractContract, Contract, ContractField } from '@cmmv/core';

@Contract({
    controllerName: 'Logs',
    protoPackage: 'repository',
    protoPath: 'logs.proto',
    subPath: '/repository',
    generateController: false,
    auth: true,
    expose: false,
    rootOnly: true,
    options: {
        moduleContract: true,
        databaseSchemaName: 'logs',
    },
})
export class LogsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    message: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    host: string;

    @ContractField({
        protoType: 'int32',
        nullable: false,
        index: true,
    })
    timestamp: number;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    source: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    level: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    file: string;

    @ContractField({
        protoType: 'string',
        objectType: 'string',
        defaultValue: "'{}'",
        nullable: true,
        transform: ({ value }) =>
            value === 'object' ? JSON.stringify(value) : '{}',
        toPlain: ({ value }) => (value === 'string' ? JSON.parse(value) : {}),
    })
    event: string;

    @ContractField({
        protoType: 'string',
        objectType: 'string',
        defaultValue: "'{}'",
        nullable: true,
        transform: ({ value }) =>
            value === 'object' ? JSON.stringify(value) : '{}',
        toPlain: ({ value }) => (value === 'string' ? JSON.parse(value) : {}),
    })
    metadata: string;
}
