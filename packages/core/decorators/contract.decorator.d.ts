export type ValidationType = string | Map<string, any> | [string, ...any[]];
export interface ValidationOption {
    type: ValidationType;
    message?: string;
    context?: any;
    value?: any;
}
export interface CacheOptions {
    key: string;
    ttl?: number;
    compress?: boolean;
}
export interface ContractFieldOptions {
    protoType: string;
    protoRepeated?: boolean;
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
    validations?: ValidationOption[];
    link?: ContractLink[];
    resolver?: string;
    customDecorator?: ContractCustomDecorator;
    readOnly?: boolean;
    afterValidation?: Function;
}
export interface ContractMethodOptions {
    customMethodName?: string;
}
export interface ContractCustomDecorator {
    [key: string]: ContractCustomOptions;
}
export interface ContractCustomOptions {
    import: string;
    options?: object;
}
export interface ContractIndex {
    name: string;
    fields: string[];
    options?: ContractIndexOptions;
}
export interface ContractIndexOptions {
    unique?: boolean;
    spatial?: boolean;
    fulltext?: boolean;
    nullFiltered?: boolean;
    parser?: string;
    where?: string;
    sparse?: boolean;
    background?: boolean;
    concurrent?: boolean;
    expireAfterSeconds?: number;
}
export interface ContractExtraOptions {
    moduleContract?: boolean;
    databaseSchemaName?: string;
    databaseTimestamps?: boolean;
    databaseUserAction?: boolean;
    databaseFakeDelete?: boolean;
    tags?: string | string[];
    description?: string;
}
export interface ContractOptions {
    namespace?: string;
    controllerName: string;
    controllerCustomPath?: string;
    subPath?: string;
    protoPath?: string;
    protoPackage?: string;
    directMessage?: boolean;
    generateController?: boolean;
    generateEntities?: boolean;
    generateBoilerplates?: boolean;
    auth?: boolean;
    rootOnly?: boolean;
    imports?: Array<string>;
    cache?: CacheOptions;
    index?: ContractIndex[];
    options?: ContractExtraOptions;
    expose?: boolean;
    isPublic?: boolean;
    viewForm?: new () => any;
    viewPage?: new () => any;
}
export interface ContractLink {
    contract?: new () => any | string;
    contractName?: string;
    entityName: string;
    entityNullable?: boolean;
    field: string;
    array?: boolean;
    createRelationship?: boolean;
}
export interface ContractMessageProperty {
    type: 'string' | 'bool' | 'int' | 'float' | 'bytes' | 'date' | 'timestamp' | 'json' | 'simpleArray' | 'bigint' | 'any' | 'enum' | 'int32' | 'int64' | 'float' | 'double';
    paramType?: 'query' | 'body' | 'path' | 'header';
    arrayType?: string;
    required: boolean;
    default?: string;
}
export interface ContractOptionsMessage {
    name: string;
    properties: Record<string, ContractMessageProperty>;
}
export interface ContractOptionsService {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
    name: string;
    request: string;
    response: string;
    auth?: boolean;
    createBoilerplate?: boolean;
    functionName: string;
    cache?: CacheOptions;
    rootOnly?: boolean;
}
export declare const NAMESPACE_METADATA: unique symbol;
export declare const PUBLIC_METADATA: unique symbol;
export declare const CONTRACT_WATERMARK: unique symbol;
export declare const CONTROLLER_NAME_METADATA: unique symbol;
export declare const SUB_PATH_METADATA: unique symbol;
export declare const PROTO_PATH_METADATA: unique symbol;
export declare const PROTO_PACKAGE_METADATA: unique symbol;
export declare const DATABASE_TYPE_METADATA: unique symbol;
export declare const FIELD_METADATA: unique symbol;
export declare const METHOD_METADATA: unique symbol;
export declare const MESSAGE_METADATA: unique symbol;
export declare const SERVICE_METADATA: unique symbol;
export declare const DIRECTMESSAGE_METADATA: unique symbol;
export declare const GENERATE_CONTROLLER_METADATA: unique symbol;
export declare const GENERATE_ENTITIES_METADATA: unique symbol;
export declare const GENERATE_BOILERPLATES_METADATA: unique symbol;
export declare const AUTH_METADATA: unique symbol;
export declare const ROOTONLY_METADATA: unique symbol;
export declare const CONTROLLER_CUSTOM_PATH_METADATA: unique symbol;
export declare const CONTROLLER_IMPORTS: unique symbol;
export declare const CONTROLLER_INDEXS: unique symbol;
export declare const CONTROLLER_CACHE: unique symbol;
export declare const CONTROLLER_OPTIONS: unique symbol;
export declare const CONTROLLER_VIEWFORM: unique symbol;
export declare const CONTROLLER_VIEWPAGE: unique symbol;
export declare function Contract(options?: ContractOptions): ClassDecorator;
export declare function ContractField(options: ContractFieldOptions): PropertyDecorator;
export declare function ContractMethod(options: ContractMethodOptions): PropertyDecorator;
export declare function ContractMessage(options?: ContractOptionsMessage): PropertyDecorator;
export declare function ContractService(options?: ContractOptionsService): PropertyDecorator;
