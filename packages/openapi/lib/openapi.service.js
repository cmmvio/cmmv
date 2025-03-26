"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPIService = void 0;
const tslib_1 = require("tslib");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");
const core_1 = require("@cmmv/core");
const http_1 = require("@cmmv/http");
const openapi_registry_1 = require("./openapi.registry");
const openapi_schemas_1 = require("./openapi.schemas");
let OpenAPIService = class OpenAPIService {
    async processOpenAPI() {
        const controllers = openapi_registry_1.OpenAPIRegistry.getControllers();
        const generalInfo = core_1.Config.get('openapi');
        const schema = {
            ...generalInfo,
            paths: {},
            security: [],
        };
        if (!schema.components)
            schema.components = {};
        if (!schema.components.schemas)
            schema.components.schemas = {};
        if (!schema.components.securitySchemes)
            schema.components.securitySchemes = {};
        //Schema
        for (let [cls, controller] of controllers) {
            if (controller.options.apiType === 'schema') {
                schema.components.schemas[controller.options.name] = {
                    properties: {
                        ...controller.properties,
                    },
                    required: controller.properties
                        ? Object.entries(controller.properties)
                            .filter(([_, value]) => value.required === true)
                            .map(([key]) => key)
                        : null,
                };
            }
        }
        schema.components.schemas['Catch'] = {
            properties: {
                status: {
                    readOnly: true,
                    type: 'number',
                    default: 500,
                    required: true,
                },
                processingTime: {
                    readOnly: true,
                    type: 'number',
                    required: true,
                },
                message: {
                    readOnly: true,
                    type: 'string',
                    required: true,
                },
                requestId: {
                    readOnly: true,
                    type: 'string',
                    required: false,
                },
                telemetry: {
                    readOnly: true,
                    type: 'array',
                    required: false,
                },
            },
            required: ['status', 'processingTime'],
        };
        //Controller
        const controllersHTTP = http_1.ControllerRegistry.getControllers();
        controllersHTTP.forEach(([controllerClass, metadata]) => {
            const prefix = metadata.prefix;
            const routes = metadata.routes;
            routes.forEach((route) => {
                let { request, response, parameters } = this.getRequestResponse(route);
                let fullPath = `/${prefix}${route.path ? '/' + route.path : ''}`;
                fullPath = fullPath
                    .replace(/\/\//g, '/')
                    .replace(/:([\w]+)/g, '{$1}');
                const method = route.method.toLowerCase();
                const isAuth = route.middlewares?.some((fn) => fn.name === 'middlewareAuth') || false;
                const exclude = route.metadata?.exclude ?? false;
                const extraDocs = route.metadata?.docs ?? null;
                const externalDocs = route.metadata?.externalDocs ?? null;
                const customBody = extraDocs?.body ?? null;
                const customReturn = extraDocs?.return ?? null;
                const customHeaders = extraDocs?.headers ?? null;
                const security = [];
                if (isAuth)
                    security.push({ BearerAuth: [] });
                if (customHeaders) {
                    parameters = [...parameters, ...customHeaders];
                }
                route.path?.split('/').map((param) => {
                    if (param.includes(':')) {
                        parameters.push({
                            name: param.replace(':', ''),
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                            },
                        });
                    }
                });
                //Body
                let requestBody = undefined;
                if (customBody && (method === 'post' || method === 'put'))
                    requestBody = { ...customBody };
                else if (request && (method === 'post' || method === 'put'))
                    requestBody = { ...request };
                //Responses
                const responses = { ...response };
                if (isAuth) {
                    responses['401'] = {
                        description: 'Unauthorized: The client must authenticate itself to get the requested response.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'string',
                                    example: 'Unauthorized',
                                },
                            },
                        },
                    };
                    responses['403'] = {
                        description: 'Forbidden: The client does not have access rights to the content.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'string',
                                    example: 'Forbidden',
                                },
                            },
                        },
                    };
                }
                responses['500'] = {
                    description: 'Internal Server Error: An unexpected error occurred on the server.',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Catch' },
                        },
                    },
                };
                if (customReturn)
                    responses['200'] = customReturn;
                if (!exclude) {
                    schema.paths[fullPath] = {
                        ...schema.paths[fullPath],
                        [method]: {
                            tags: [
                                controllerClass.name
                                    .replace('Generated', '')
                                    .replace('Controller', ''),
                            ],
                            summary: route.metadata?.summary ?? '',
                            externalDocs: { url: externalDocs },
                            requestBody,
                            responses,
                            parameters,
                            security,
                        },
                    };
                }
            });
        });
        const openAPIPath = path.resolve(__dirname, '../../../public/openapi.json');
        fs.writeFileSync(openAPIPath, JSON.stringify(schema, null, 2));
        fs.writeFileSync(openAPIPath.replace('.json', '.yml'), yaml.dump(schema, {
            indent: 2,
        }));
    }
    findContract(contractName) {
        const contracts = core_1.Scope.getArray('__contracts');
        return contracts.find((contract) => contract.contractName === contractName);
    }
    getRequestResponse(route) {
        let request = null;
        let response = null;
        let parameters = [];
        const schema = route.metadata?.schema ?? null;
        const exposeFilters = route.metadata?.exposeFilters ?? true;
        const contractMetadata = route.metadata?.contract ?? null;
        const contract = contractMetadata
            ? this.findContract(contractMetadata?.name)
            : null;
        if (!contract)
            return { request, response, parameters };
        const contractName = contract.controllerName;
        const properties = {};
        const propertiesUpdate = {};
        const requiredFields = [];
        for (const key in contract.fields) {
            if (Object.prototype.hasOwnProperty.call(contract.fields, key)) {
                const field = contract.fields[key];
                if (field.exclude !== true) {
                    const fieldName = field.propertyKey;
                    properties[fieldName] = {
                        type: field.protoType,
                        nullable: field.nullable ?? false,
                    };
                    if (field.protoRepeated) {
                        properties[fieldName] = {
                            type: 'array',
                            items: {
                                type: field.objectType || field.protoType,
                            },
                        };
                    }
                    if (field.unique)
                        properties[fieldName].uniqueItems = true;
                    if (field.defaultValue !== undefined)
                        properties[fieldName].default = field.defaultValue;
                    if (field.validations)
                        properties[fieldName].validations = field.validations;
                    if (!field.nullable)
                        requiredFields.push(key);
                    if (field.readOnly !== true)
                        propertiesUpdate[fieldName] = properties[fieldName];
                }
            }
        }
        switch (schema) {
            case http_1.RouterSchema.GetByID:
            case http_1.RouterSchema.GetAll:
                response = {
                    '200': {
                        description: `${contractName} response schema`,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'number' },
                                        processingTime: { type: 'number' },
                                        result: {
                                            type: 'object',
                                            properties: {
                                                data: {
                                                    type: 'array',
                                                    items: {
                                                        $ref: `#/components/schemas/${contract.controllerName}`,
                                                    },
                                                },
                                                count: { type: 'number' },
                                                pagination: {
                                                    type: 'object',
                                                    properties: {
                                                        limit: {
                                                            type: 'number',
                                                        },
                                                        offset: {
                                                            type: 'number',
                                                        },
                                                        sortBy: {
                                                            type: 'string',
                                                            default: 'id',
                                                        },
                                                        sort: {
                                                            type: 'string',
                                                            default: 'asc',
                                                        },
                                                        search: {
                                                            type: 'string',
                                                        },
                                                        searchField: {
                                                            type: 'string',
                                                        },
                                                        filters: {
                                                            type: 'object',
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                };
                if (exposeFilters && schema === http_1.RouterSchema.GetAll)
                    parameters = openapi_schemas_1.SchemaGetAll;
                break;
            case http_1.RouterSchema.Raw:
                response = {
                    '200': {
                        description: `${contractName} response schema`,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/User',
                                },
                            },
                        },
                    },
                };
                break;
            case http_1.RouterSchema.Update:
            case http_1.RouterSchema.Delete:
                response = {
                    '200': {
                        description: `${contractName} ${schema === http_1.RouterSchema.Update ? 'update' : 'delete'} response schema`,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        affected: { type: 'number' },
                                    },
                                },
                            },
                        },
                    },
                };
                if (exposeFilters && schema === http_1.RouterSchema.Update) {
                    request = {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: propertiesUpdate,
                                },
                            },
                        },
                    };
                }
                break;
            case http_1.RouterSchema.Insert:
                /*response = {
                    "200": {
                        description: `${contractName} response schema`,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'number' },
                                        processingTime: { type: 'number' },
                                        result: {
                                            type: 'object',
                                            properties: {
                                                data: {
                                                    type: 'array',
                                                    items: {
                                                        "$ref": `#/components/schemas/${contract.controllerName}`
                                                    }
                                                },
                                                count: { type: 'number' },
                                                pagination: {
                                                    type: 'object',
                                                    properties: {
                                                        limit: { type: 'number' },
                                                        offset: { type: 'number' },
                                                        sortBy: { type: 'string', default: "id" },
                                                        sort: { type: 'string', default: "asc" },
                                                        search: { type: 'string' },
                                                        searchField: { type: 'string' },
                                                        filters: { type: 'object' },
                                                    }
                                                }
                                            }
                                        }
                                    },
                                },
                            },
                        }
                    }
                };*/
                request = {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: propertiesUpdate,
                            },
                        },
                    },
                };
                break;
        }
        return { request, response, parameters };
    }
};
exports.OpenAPIService = OpenAPIService;
tslib_1.__decorate([
    (0, core_1.Hook)(core_1.HooksType.onInitialize),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], OpenAPIService.prototype, "processOpenAPI", null);
exports.OpenAPIService = OpenAPIService = tslib_1.__decorate([
    (0, core_1.Service)('openapi')
], OpenAPIService);
