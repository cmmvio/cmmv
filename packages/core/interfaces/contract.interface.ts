import {
    CacheOptions,
    ContractIndex,
    ContractExtraOptions,
    ContractCustomDecorator,
    ContractIndexOptions,
    ContractMessageProperty,
    ContractLink,
} from '../decorators/contract.decorator';

export class IContract {
    namespace?: string;
    isPublic?: boolean;
    contractName: string;
    controllerName: string;
    subPath?: string;
    protoPath?: string;
    protoPackage?: string;
    fields: IContractField[];
    messages?: IContractMessage[];
    services?: IContractService[];
    directMessage?: boolean;
    generateController?: boolean;
    generateEntities?: boolean;
    generateBoilerplates?: boolean;
    auth?: boolean;
    rootOnly?: boolean;
    controllerCustomPath?: string;
    imports?: Array<string>;
    indexs?: ContractIndex[];
    cache?: CacheOptions;
    customProto?: string | Function;
    customTypes?: string | Function;
    options?: ContractExtraOptions;
    tags?: string | string[];
    viewForm?: new () => any;
    viewPage?: new () => any;
}

export class IContractField {
    propertyKey: string;
    protoType: string;
    protoRepeated?: boolean; //deprecated
    array?: boolean;
    defaultValue?: any;
    index?: boolean;
    unique?: boolean;
    exclude?: boolean;
    nullable?: boolean;
    toClassOnly?: boolean;
    toPlainOnly?: boolean;
    transform?: Function;
    toObject?: Function;
    toPlain?: Function;
    objectType?: string;
    entityType?: string;
    entityNullable?: boolean;
    modelName?: string;
    validations?: Array<any>;
    link?: ContractLink[];
    resolver?: string;
    customDecorator?: ContractCustomDecorator;
    readOnly?: boolean;
    afterValidation?: Function;
}

export class IContractMessage {
    propertyKey: string;
    name: string;
    properties: Record<string, ContractMessageProperty>;
}

export class IContractService {
    propertyKey: string;
    name: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
    auth?: boolean;
    rootOnly?: boolean;
    cache?: CacheOptions;
    functionName?: string;
    request: string;
    response: string;
    createBoilerplate?: boolean;
}

export class IContractIndex {
    name: string;
    fields: Array<any>;
    options?: ContractIndexOptions;
}
