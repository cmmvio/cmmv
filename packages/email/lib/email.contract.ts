import { AbstractContract, Contract, ContractField } from '@cmmv/core';

@Contract({
    namespace: 'Email',
    controllerName: 'EmailSending',
    protoPackage: 'email',
    subPath: '/email',
    generateController: false,
    generateBoilerplates: false,
    auth: true,
    rootOnly: true,
    options: {
        moduleContract: true,
        databaseSchemaName: 'email_sending',
        databaseTimestamps: true,
    },
})
export class EmailSendingContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        readOnly: true,
    })
    email: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        readOnly: true,
    })
    messageId: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        readOnly: true,
    })
    subject: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        readOnly: true,
    })
    context: string;

    @ContractField({
        protoType: 'bool',
        defaultValue: false,
        nullable: false,
        readOnly: true,
    })
    recived: boolean;

    @ContractField({
        protoType: 'datetime',
        nullable: true,
        readOnly: true,
    })
    recivedAt: Date;

    @ContractField({
        protoType: 'bool',
        defaultValue: false,
        nullable: false,
        readOnly: true,
    })
    opened: boolean;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    error: string;

    @ContractField({
        protoType: 'string',
        index: true,
        nullable: true,
        readOnly: true,
    })
    pixelId: string;
}
