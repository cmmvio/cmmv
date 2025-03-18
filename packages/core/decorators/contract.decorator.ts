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
    tags?: string | string[];
    description?: string;
}

export interface ContractOptions {
    controllerName: string;
    controllerCustomPath?: string;
    subPath?: string;
    protoPath?: string;
    protoPackage?: string; //deprecated
    directMessage?: boolean;
    generateController?: boolean;
    generateEntities?: boolean;
    auth?: boolean;
    rootOnly?: boolean;
    imports?: Array<string>;
    cache?: CacheOptions;
    index?: ContractIndex[];
    options?: ContractExtraOptions;
    viewForm?: new () => any;
    viewPage?: new () => any;
}

export interface ContractLink {
    contract: new () => any;
    entityName: string;
    entityNullable?: boolean;
    field: string;
    array?: boolean;
    createRelationship?: boolean;
}

export interface ContractMessageProperty {
    type:
        | 'string'
        | 'bool'
        | 'int'
        | 'float'
        | 'bytes'
        | 'date'
        | 'timestamp'
        | 'json'
        | 'simpleArray'
        | 'bigint'
        | 'any';
    paramType: 'query' | 'body' | 'path' | 'header';
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
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    name: string;
    request: string;
    response: string;
    auth?: boolean;
    createBoilerplate?: boolean;
    functionName: string;
}

export const CONTRACT_WATERMARK = Symbol('contract_watermark');
export const CONTROLLER_NAME_METADATA = Symbol('controller_name_metadata');
export const SUB_PATH_METADATA = Symbol('sub_path_metadata');
export const PROTO_PATH_METADATA = Symbol('proto_path_metadata');
export const PROTO_PACKAGE_METADATA = Symbol('proto_package_metadata');
export const DATABASE_TYPE_METADATA = Symbol('database_type_metadata');
export const FIELD_METADATA = Symbol('contract_field_metadata');
export const METHOD_METADATA = Symbol('contract_method_metadata');
export const MESSAGE_METADATA = Symbol('contract_message_metadata');
export const SERVICE_METADATA = Symbol('contract_service_metadata');
export const DIRECTMESSAGE_METADATA = Symbol('contract_directmessage_metadata');
export const GENERATE_CONTROLLER_METADATA = Symbol(
    'generate_controller_metadata',
);
export const GENERATE_ENTITIES_METADATA = Symbol('generate_entities_metadata');
export const AUTH_METADATA = Symbol('auth_metadata');
export const ROOTONLY_METADATA = Symbol('rootonly_metadata');
export const CONTROLLER_CUSTOM_PATH_METADATA = Symbol(
    'controller_custom_path_metadata',
);
export const CONTROLLER_IMPORTS = Symbol('contract_imports');
export const CONTROLLER_INDEXS = Symbol('contract_indexs');
export const CONTROLLER_CACHE = Symbol('contract_cache');
export const CONTROLLER_OPTIONS = Symbol('contract_options');
export const CONTROLLER_VIEWFORM = Symbol('contract_viewform');
export const CONTROLLER_VIEWPAGE = Symbol('contract_viewpage');

export function Contract(options?: ContractOptions): ClassDecorator {
    const isValidClass = (value: any) => {
        return typeof value === 'function' && value.prototype;
    };

    if (options?.viewForm && !isValidClass(options.viewForm))
        throw new Error(`Invalid viewForm provided: ${options.viewForm}`);

    if (options?.viewPage && !isValidClass(options.viewPage))
        throw new Error(`Invalid viewPage provided: ${options.viewPage}`);

    const defaultControllerName = 'DefaultContract';
    const defaultSubPath = '';
    const defaultProtoPath = 'contract.proto';
    const defaultProtoPackage = '';
    const defaultDirectMessage = false;
    const defaultGenerateController = true;
    const defaultGenerateEntities = true;
    const defaultAuth = true;
    const defaultRootOnly = false;
    const defaultControllerCustomPath = '';
    const defaultImports = [];
    const defaultIndexs = [];
    const defaultCache = null;
    const defaultOptions = null;
    const defaultViewForm = null;
    const defaultViewPage = null;

    const [
        controllerName,
        subPath,
        protoPath,
        directMessage,
        protoPackage,
        generateController,
        generateEntities,
        auth,
        rootOnly,
        controllerCustomPath,
        imports,
        indexs,
        cache,
        optionsExtra,
        viewForm,
        viewPage,
    ] = !options
        ? [
              defaultControllerName,
              defaultSubPath,
              defaultProtoPath,
              defaultDirectMessage,
              defaultProtoPackage,
              defaultGenerateController,
              defaultGenerateEntities,
              defaultAuth,
              defaultRootOnly,
              defaultControllerCustomPath,
              defaultImports,
              defaultIndexs,
              defaultCache,
              defaultOptions,
              defaultViewForm,
              defaultViewPage,
          ]
        : [
              options.controllerName || defaultControllerName,
              options.subPath || defaultSubPath,
              options.protoPath || defaultProtoPath,
              options.directMessage || defaultDirectMessage,
              options.protoPackage || defaultProtoPackage,
              options.generateController ?? defaultGenerateController,
              options.generateEntities ?? defaultGenerateEntities,
              options.auth ?? defaultAuth,
              options.rootOnly ?? defaultRootOnly,
              options.controllerCustomPath || defaultControllerCustomPath,
              options.imports || defaultImports,
              options.index || defaultIndexs,
              options.cache || defaultCache,
              options.options || defaultOptions,
              options.viewForm || defaultViewForm,
              options.viewPage || defaultViewPage,
          ];

    return (target: object) => {
        Reflect.defineMetadata(CONTRACT_WATERMARK, true, target);
        Reflect.defineMetadata(
            CONTROLLER_NAME_METADATA,
            controllerName,
            target,
        );
        Reflect.defineMetadata(SUB_PATH_METADATA, subPath, target);
        Reflect.defineMetadata(PROTO_PATH_METADATA, protoPath, target);
        Reflect.defineMetadata(PROTO_PACKAGE_METADATA, protoPackage, target);
        Reflect.defineMetadata(DIRECTMESSAGE_METADATA, directMessage, target);
        Reflect.defineMetadata(
            GENERATE_CONTROLLER_METADATA,
            generateController,
            target,
        );
        Reflect.defineMetadata(
            GENERATE_ENTITIES_METADATA,
            generateEntities,
            target,
        );
        Reflect.defineMetadata(AUTH_METADATA, auth, target);
        Reflect.defineMetadata(ROOTONLY_METADATA, rootOnly, target);
        Reflect.defineMetadata(
            CONTROLLER_CUSTOM_PATH_METADATA,
            controllerCustomPath,
            target,
        );
        Reflect.defineMetadata(CONTROLLER_IMPORTS, imports, target);
        Reflect.defineMetadata(CONTROLLER_INDEXS, indexs, target);
        Reflect.defineMetadata(CONTROLLER_CACHE, cache, target);
        Reflect.defineMetadata(CONTROLLER_OPTIONS, optionsExtra, target);
        Reflect.defineMetadata(CONTROLLER_VIEWFORM, viewForm, target);
        Reflect.defineMetadata(CONTROLLER_VIEWPAGE, viewPage, target);
    };
}

export function ContractField(
    options: ContractFieldOptions,
): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
        const existingFields =
            Reflect.getMetadata(FIELD_METADATA, target) || [];

        const newField = { propertyKey, ...options };
        existingFields.push(newField);

        Reflect.defineMetadata(FIELD_METADATA, existingFields, target);
    };
}

export function ContractMethod(
    options: ContractMethodOptions,
): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
        const existingMethods =
            Reflect.getMetadata(METHOD_METADATA, target) || [];

        const newMethod = { propertyKey, ...options };
        existingMethods.push(newMethod);

        Reflect.defineMetadata(METHOD_METADATA, existingMethods, target);
    };
}

export function ContractMessage(
    options?: ContractOptionsMessage,
): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
        const existingFields =
            Reflect.getMetadata(MESSAGE_METADATA, target) || [];

        const newField = { propertyKey, ...options };
        existingFields.push(newField);

        Reflect.defineMetadata(MESSAGE_METADATA, existingFields, target);
    };
}

export function ContractService(
    options?: ContractOptionsService,
): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
        const existingFields =
            Reflect.getMetadata(SERVICE_METADATA, target) || [];

        const newField = { propertyKey, ...options };
        existingFields.push(newField);

        Reflect.defineMetadata(SERVICE_METADATA, existingFields, target);
    };
}
