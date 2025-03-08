import { OpenAPIRegistry } from './openapi.registry';

import {
    IOpenAPIPropertyOptions,
    IOpenAPISchemaOptions,
    IOpenAPIParameter,
    ParametersType,
} from './openapi.interface';

/* Controller */
export function ApiTags(...tags: string[]): MethodDecorator & ClassDecorator {
    return (
        target: object,
        key?: string | symbol,
        descriptor?: TypedPropertyDescriptor<any>,
    ) => {
        if (descriptor) {
        } else {
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
