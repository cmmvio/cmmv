import { OpenAPIRegistry } from './openapi.registry';

import {
    IOpenAPIPropertyOptions,
    IOpenAPISchemaOptions,
    IOpenAPIParameter,
    ParametersType,
    IOpenAPISecuritySchema,
    SecuritySchemeType,
} from './openapi.interface';

/* Controller */
export function ApiTags(...tags: string[]): MethodDecorator & ClassDecorator {
    return (
        target: object,
        key?: string | symbol,
        descriptor?: TypedPropertyDescriptor<any>,
    ) => {
        if (descriptor) {
            tags.map((tag) =>
                OpenAPIRegistry.addHandlerMetadataArray(
                    target,
                    key as string,
                    'tags',
                    tag,
                ),
            );
        } else {
            //Class
            OpenAPIRegistry.controllerMetadata(target, {
                tags,
            });
        }
    };
}

export function ApiExcludeController(disable: boolean = true): ClassDecorator {
    return (target: object) =>
        OpenAPIRegistry.controllerMetadata(target, {
            exclude: disable,
        });
}

/* Property */
export function ApiSchema(options?: IOpenAPISchemaOptions): ClassDecorator {
    return (target: object) =>
        OpenAPIRegistry.registerController(target, {
            apiType: 'schema',
            ...options,
        });
}

export function ApiProperty(
    options: IOpenAPIPropertyOptions = {},
    overrideExisting = true,
): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
        const propertyType = Reflect.getMetadata(
            'design:type',
            target,
            propertyKey,
        );

        const typeMap: Record<string, string> = {
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

        if (!options) options = { type: resolvedType };

        if (Array.isArray(options.type) && options.type.length > 0) {
            const resolvedSubType = typeMap[options.type[0].name];

            if (!resolvedSubType) {
                resolvedType = 'array';
                options.items = {
                    $ref: `#/components/schemas/${options.type[0].name}`,
                };
            } else {
                options.items = {
                    type: resolvedSubType,
                };
            }

            options.type = 'array';
        }

        options.type = resolvedType;

        OpenAPIRegistry.registerProperty(
            target,
            propertyKey,
            options,
            overrideExisting,
        );
    };
}

export function ApiPropertyOptional(
    options: IOpenAPIPropertyOptions = {},
): PropertyDecorator {
    return ApiProperty({
        ...options,
        required: false,
    } as IOpenAPIPropertyOptions);
}

export function ApiResponseProperty(
    options: IOpenAPIPropertyOptions = {},
): PropertyDecorator {
    return ApiProperty({
        readOnly: true,
        ...options,
    } as IOpenAPIPropertyOptions);
}

export function ApiHideProperty(): PropertyDecorator {
    return (target: Record<string, any>, propertyKey: string | symbol) => {};
}

/* Methods */
function createParamsAPI(options: IOpenAPIParameter, type: ParametersType) {
    return (target, propertyKey: string | symbol, context?: any) => {
        OpenAPIRegistry.addHandlerMetadataArray<IOpenAPIParameter>(
            target,
            propertyKey as string,
            'parameters',
            {
                in: type,
                ...options,
            },
        );
    };
}

export function ApiQuery(options: IOpenAPIParameter): MethodDecorator {
    return createParamsAPI(options, 'query');
}

export function ApiHeader(options: IOpenAPIParameter): MethodDecorator {
    return createParamsAPI(options, 'header');
}

export function ApiParam(options: IOpenAPIParameter): MethodDecorator {
    return createParamsAPI(options, 'path');
}

export function ApiCookie(options: IOpenAPIParameter): MethodDecorator {
    return createParamsAPI(options, 'header');
}

/* Security */
function createSecuritySchema(
    target: object,
    propertyKey: string | symbol,
    options: IOpenAPISecuritySchema,
    type: SecuritySchemeType,
) {
    OpenAPIRegistry.addHandlerMetadataArray<IOpenAPISecuritySchema>(
        target,
        propertyKey as string,
        'securitySchemes',
        {
            type: type,
            ...options,
        },
    );
}

function createSecurity(
    target: object,
    propertyKey: string | symbol,
    options: any,
) {
    OpenAPIRegistry.addHandlerMetadataArray(
        target,
        propertyKey as string,
        'security',
        options,
    );
}

export function ApiSecurity(
    roles: string[] | string,
): MethodDecorator & ClassDecorator {
    return (
        target: object,
        propertyKey?: string | symbol,
        descriptor?: TypedPropertyDescriptor<any>,
    ) => {
        if (descriptor) {
            createSecurity(
                target,
                propertyKey,
                Array.isArray(roles) ? roles : [roles],
            );
        } else {
            //Class
            OpenAPIRegistry.controllerMetadata(target, {
                security: Array.isArray(roles) ? roles : [roles],
            });
        }
    };
}

export function ApiSecuritySchema(
    options: IOpenAPISecuritySchema = {},
    type: SecuritySchemeType,
): MethodDecorator & ClassDecorator {
    return (
        target: object,
        propertyKey?: string | symbol,
        descriptor?: TypedPropertyDescriptor<any>,
    ) => {
        if (descriptor) {
            createSecuritySchema(target, propertyKey, options, type);
        } else {
            //Class
            OpenAPIRegistry.appendMetadataObject(target, 'components', {
                securitySchemes: options,
            });
        }
    };
}
