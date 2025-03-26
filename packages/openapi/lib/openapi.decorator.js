"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTags = ApiTags;
exports.ApiExcludeController = ApiExcludeController;
exports.ApiSchema = ApiSchema;
exports.ApiProperty = ApiProperty;
exports.ApiPropertyOptional = ApiPropertyOptional;
exports.ApiResponseProperty = ApiResponseProperty;
exports.ApiHideProperty = ApiHideProperty;
exports.ApiQuery = ApiQuery;
exports.ApiHeader = ApiHeader;
exports.ApiParam = ApiParam;
exports.ApiCookie = ApiCookie;
exports.ApiSecurity = ApiSecurity;
exports.ApiSecuritySchema = ApiSecuritySchema;
const openapi_registry_1 = require("./openapi.registry");
/* Controller */
function ApiTags(...tags) {
    return (target, key, descriptor) => {
        if (descriptor) {
            tags.map((tag) => openapi_registry_1.OpenAPIRegistry.addHandlerMetadataArray(target, key, 'tags', tag));
        }
        else {
            //Class
            openapi_registry_1.OpenAPIRegistry.controllerMetadata(target, {
                tags,
            });
        }
    };
}
function ApiExcludeController(disable = true) {
    return (target) => openapi_registry_1.OpenAPIRegistry.controllerMetadata(target, {
        exclude: disable,
    });
}
/* Property */
function ApiSchema(options) {
    return (target) => openapi_registry_1.OpenAPIRegistry.registerController(target, {
        apiType: 'schema',
        ...options,
    });
}
function ApiProperty(options = {}, overrideExisting = true) {
    return (target, propertyKey) => {
        const propertyType = Reflect.getMetadata('design:type', target, propertyKey);
        const typeMap = {
            String: 'string',
            Number: 'number',
            Boolean: 'boolean',
            Object: 'object',
            Array: 'array',
            Date: 'string',
        };
        let resolvedType = propertyType?.name
            ? typeMap[propertyType.name] || propertyType.name.toLowerCase()
            : 'object';
        if (!options)
            options = { type: resolvedType };
        if (Array.isArray(options.type) && options.type.length > 0) {
            const resolvedSubType = typeMap[options.type[0].name];
            if (!resolvedSubType) {
                resolvedType = 'array';
                options.items = {
                    $ref: `#/components/schemas/${options.type[0].name}`,
                };
            }
            else {
                options.items = {
                    type: resolvedSubType,
                };
            }
            options.type = 'array';
        }
        options.type = resolvedType;
        openapi_registry_1.OpenAPIRegistry.registerProperty(target, propertyKey, options, overrideExisting);
    };
}
function ApiPropertyOptional(options = {}) {
    return ApiProperty({
        ...options,
        required: false,
    });
}
function ApiResponseProperty(options = {}) {
    return ApiProperty({
        readOnly: true,
        ...options,
    });
}
function ApiHideProperty() {
    return (target, propertyKey) => { };
}
/* Methods */
function createParamsAPI(options, type) {
    return (target, propertyKey, context) => {
        openapi_registry_1.OpenAPIRegistry.addHandlerMetadataArray(target, propertyKey, 'parameters', {
            in: type,
            ...options,
        });
    };
}
function ApiQuery(options) {
    return createParamsAPI(options, 'query');
}
function ApiHeader(options) {
    return createParamsAPI(options, 'header');
}
function ApiParam(options) {
    return createParamsAPI(options, 'path');
}
function ApiCookie(options) {
    return createParamsAPI(options, 'header');
}
/* Security */
function createSecuritySchema(target, propertyKey, options, type) {
    openapi_registry_1.OpenAPIRegistry.addHandlerMetadataArray(target, propertyKey, 'securitySchemes', {
        type: type,
        ...options,
    });
}
function createSecurity(target, propertyKey, options) {
    openapi_registry_1.OpenAPIRegistry.addHandlerMetadataArray(target, propertyKey, 'security', options);
}
function ApiSecurity(roles) {
    return (target, propertyKey, descriptor) => {
        if (descriptor) {
            createSecurity(target, propertyKey, Array.isArray(roles) ? roles : [roles]);
        }
        else {
            //Class
            openapi_registry_1.OpenAPIRegistry.controllerMetadata(target, {
                security: Array.isArray(roles) ? roles : [roles],
            });
        }
    };
}
function ApiSecuritySchema(options = {}, type) {
    return (target, propertyKey, descriptor) => {
        if (descriptor) {
            createSecuritySchema(target, propertyKey, options, type);
        }
        else {
            //Class
            openapi_registry_1.OpenAPIRegistry.appendMetadataObject(target, 'components', {
                securitySchemes: options,
            });
        }
    };
}
