import { AbstractContract, Contract, ContractField } from '@cmmv/core';

@Contract({
    isPublic: true,
    controllerName: 'I18NCountries',
    protoPackage: 'i18n',
    subPath: '/i18n',
    generateController: true,
    generateEntities: true,
    auth: true,
    rootOnly: false,
    controllerCustomPath: 'i18n/countries',
    options: {
        tags: [],
        moduleContract: false,
        databaseSchemaName: 'i18n-countries',
        databaseTimestamps: true,
        databaseUserAction: false,
    },
})
export class I18NCountriesContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        unique: true,
        nullable: true,
        index: true,
    })
    name?: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    iso?: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    alpha3: string;

    @ContractField({
        protoType: 'int32',
    })
    numeric: number;

    @ContractField({
        protoType: 'string',
        index: false,
    })
    ddi: string;

    @ContractField({
        protoType: 'string',
    })
    phoneMask: string;
}
