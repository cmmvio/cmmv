import {
    CacheOptions,
    ContractIndex,
    ContractExtraOptions,
} from '../decorators/contract.decorator';

export class IContract {
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
    unique?: boolean;
    validations?: Array<any>;
    transform?: Function;
    link?: ContractIndex[];
    resolver?: string;
    afterValidation?: Function;
}

export class IContractMessage {
    propertyKey: string;
    name: string;
    properties: Object;
}

export class IContractService {
    propertyKey: string;
    name: string;
    path: string;
    method: string;
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
}
