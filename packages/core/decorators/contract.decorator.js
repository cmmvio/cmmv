"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTROLLER_VIEWPAGE = exports.CONTROLLER_VIEWFORM = exports.CONTROLLER_OPTIONS = exports.CONTROLLER_CACHE = exports.CONTROLLER_INDEXS = exports.CONTROLLER_IMPORTS = exports.CONTROLLER_CUSTOM_PATH_METADATA = exports.ROOTONLY_METADATA = exports.AUTH_METADATA = exports.GENERATE_BOILERPLATES_METADATA = exports.GENERATE_ENTITIES_METADATA = exports.GENERATE_CONTROLLER_METADATA = exports.DIRECTMESSAGE_METADATA = exports.SERVICE_METADATA = exports.MESSAGE_METADATA = exports.METHOD_METADATA = exports.FIELD_METADATA = exports.DATABASE_TYPE_METADATA = exports.PROTO_PACKAGE_METADATA = exports.PROTO_PATH_METADATA = exports.SUB_PATH_METADATA = exports.CONTROLLER_NAME_METADATA = exports.CONTRACT_WATERMARK = exports.PUBLIC_METADATA = exports.NAMESPACE_METADATA = void 0;
exports.Contract = Contract;
exports.ContractField = ContractField;
exports.ContractMethod = ContractMethod;
exports.ContractMessage = ContractMessage;
exports.ContractService = ContractService;
exports.NAMESPACE_METADATA = Symbol('namespace_metadata');
exports.PUBLIC_METADATA = Symbol('public_metadata');
exports.CONTRACT_WATERMARK = Symbol('contract_watermark');
exports.CONTROLLER_NAME_METADATA = Symbol('controller_name_metadata');
exports.SUB_PATH_METADATA = Symbol('sub_path_metadata');
exports.PROTO_PATH_METADATA = Symbol('proto_path_metadata');
exports.PROTO_PACKAGE_METADATA = Symbol('proto_package_metadata');
exports.DATABASE_TYPE_METADATA = Symbol('database_type_metadata');
exports.FIELD_METADATA = Symbol('contract_field_metadata');
exports.METHOD_METADATA = Symbol('contract_method_metadata');
exports.MESSAGE_METADATA = Symbol('contract_message_metadata');
exports.SERVICE_METADATA = Symbol('contract_service_metadata');
exports.DIRECTMESSAGE_METADATA = Symbol('contract_directmessage_metadata');
exports.GENERATE_CONTROLLER_METADATA = Symbol('generate_controller_metadata');
exports.GENERATE_ENTITIES_METADATA = Symbol('generate_entities_metadata');
exports.GENERATE_BOILERPLATES_METADATA = Symbol('generate_boilerplates_metadata');
exports.AUTH_METADATA = Symbol('auth_metadata');
exports.ROOTONLY_METADATA = Symbol('rootonly_metadata');
exports.CONTROLLER_CUSTOM_PATH_METADATA = Symbol('controller_custom_path_metadata');
exports.CONTROLLER_IMPORTS = Symbol('contract_imports');
exports.CONTROLLER_INDEXS = Symbol('contract_indexs');
exports.CONTROLLER_CACHE = Symbol('contract_cache');
exports.CONTROLLER_OPTIONS = Symbol('contract_options');
exports.CONTROLLER_VIEWFORM = Symbol('contract_viewform');
exports.CONTROLLER_VIEWPAGE = Symbol('contract_viewpage');
function Contract(options) {
    const isValidClass = (value) => {
        return typeof value === 'function' && value.prototype;
    };
    if (options?.viewForm && !isValidClass(options.viewForm))
        throw new Error(`Invalid viewForm provided: ${options.viewForm}`);
    if (options?.viewPage && !isValidClass(options.viewPage))
        throw new Error(`Invalid viewPage provided: ${options.viewPage}`);
    const defaultNamespace = '';
    const defaultIsPublic = false;
    const defaultControllerName = 'DefaultContract';
    const defaultSubPath = '';
    const defaultProtoPath = 'contract.proto';
    const defaultProtoPackage = '';
    const defaultDirectMessage = false;
    const defaultGenerateController = true;
    const defaultGenerateEntities = true;
    const defaultGenerateBoilerplates = true;
    const defaultAuth = true;
    const defaultRootOnly = false;
    const defaultControllerCustomPath = '';
    const defaultImports = [];
    const defaultIndexs = [];
    const defaultCache = null;
    const defaultOptions = null;
    const defaultViewForm = null;
    const defaultViewPage = null;
    const [namespace, isPublic, controllerName, subPath, protoPath, directMessage, protoPackage, generateController, generateEntities, generateBoilerplates, auth, rootOnly, controllerCustomPath, imports, indexs, cache, optionsExtra, viewForm, viewPage,] = !options
        ? [
            defaultNamespace,
            defaultIsPublic,
            defaultControllerName,
            defaultSubPath,
            defaultProtoPath,
            defaultDirectMessage,
            defaultProtoPackage,
            defaultGenerateController,
            defaultGenerateEntities,
            defaultGenerateBoilerplates,
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
            options.namespace || defaultNamespace,
            options.isPublic ?? defaultIsPublic,
            options.controllerName || defaultControllerName,
            options.subPath || defaultSubPath,
            options.protoPath || defaultProtoPath,
            options.directMessage || defaultDirectMessage,
            options.protoPackage || defaultProtoPackage,
            options.generateController ?? defaultGenerateController,
            options.generateEntities ?? defaultGenerateEntities,
            options.generateBoilerplates ?? defaultGenerateBoilerplates,
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
    return (target) => {
        Reflect.defineMetadata(exports.NAMESPACE_METADATA, namespace, target);
        Reflect.defineMetadata(exports.PUBLIC_METADATA, isPublic, target);
        Reflect.defineMetadata(exports.CONTRACT_WATERMARK, true, target);
        Reflect.defineMetadata(exports.CONTROLLER_NAME_METADATA, controllerName, target);
        Reflect.defineMetadata(exports.SUB_PATH_METADATA, subPath, target);
        Reflect.defineMetadata(exports.PROTO_PATH_METADATA, protoPath, target);
        Reflect.defineMetadata(exports.PROTO_PACKAGE_METADATA, protoPackage, target);
        Reflect.defineMetadata(exports.DIRECTMESSAGE_METADATA, directMessage, target);
        Reflect.defineMetadata(exports.GENERATE_CONTROLLER_METADATA, generateController, target);
        Reflect.defineMetadata(exports.GENERATE_ENTITIES_METADATA, generateEntities, target);
        Reflect.defineMetadata(exports.GENERATE_BOILERPLATES_METADATA, generateBoilerplates, target);
        Reflect.defineMetadata(exports.AUTH_METADATA, auth, target);
        Reflect.defineMetadata(exports.ROOTONLY_METADATA, rootOnly, target);
        Reflect.defineMetadata(exports.CONTROLLER_CUSTOM_PATH_METADATA, controllerCustomPath, target);
        Reflect.defineMetadata(exports.CONTROLLER_IMPORTS, imports, target);
        Reflect.defineMetadata(exports.CONTROLLER_INDEXS, indexs, target);
        Reflect.defineMetadata(exports.CONTROLLER_CACHE, cache, target);
        Reflect.defineMetadata(exports.CONTROLLER_OPTIONS, optionsExtra, target);
        Reflect.defineMetadata(exports.CONTROLLER_VIEWFORM, viewForm, target);
        Reflect.defineMetadata(exports.CONTROLLER_VIEWPAGE, viewPage, target);
    };
}
function ContractField(options) {
    return (target, propertyKey) => {
        const existingFields = Reflect.getMetadata(exports.FIELD_METADATA, target) || [];
        const newField = { propertyKey, ...options };
        existingFields.push(newField);
        Reflect.defineMetadata(exports.FIELD_METADATA, existingFields, target);
    };
}
function ContractMethod(options) {
    return (target, propertyKey) => {
        const existingMethods = Reflect.getMetadata(exports.METHOD_METADATA, target) || [];
        const newMethod = { propertyKey, ...options };
        existingMethods.push(newMethod);
        Reflect.defineMetadata(exports.METHOD_METADATA, existingMethods, target);
    };
}
function ContractMessage(options) {
    return (target, propertyKey) => {
        const existingFields = Reflect.getMetadata(exports.MESSAGE_METADATA, target) || [];
        const newField = { propertyKey, ...options };
        existingFields.push(newField);
        Reflect.defineMetadata(exports.MESSAGE_METADATA, existingFields, target);
    };
}
function ContractService(options) {
    return (target, propertyKey) => {
        const existingFields = Reflect.getMetadata(exports.SERVICE_METADATA, target) || [];
        const newField = { propertyKey, ...options };
        existingFields.push(newField);
        Reflect.defineMetadata(exports.SERVICE_METADATA, existingFields, target);
    };
}
