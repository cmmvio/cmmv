import { ControllerRegistry } from '../registries/controller.registry';
import { createRouteMiddleware } from './route-middleware.util';

/**
 * Register a controller
 * @param prefix - The controller prefix
 * @returns The controller decorator
 */
export function Controller(prefix: string = ''): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata('controller_prefix', prefix, target);
        ControllerRegistry.registerController(target, prefix);
    };
}

/**
 * Create a method decorator
 * @param method - The method
 * @param path - The path
 * @param cb - The callback
 * @param metadata - The metadata
 * @returns The method decorator
 */
function createMethodDecorator(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    cb?: Function,
    metadata?: RouterMetadata,
): MethodDecorator {
    return (target, propertyKey: string | symbol, context?: any) => {
        ControllerRegistry.registerRoute(
            target,
            method,
            path,
            propertyKey as string,
            context.value,
            cb,
            metadata,
        );
    };
}

/**
 * Router metadata
 */
export interface RouterMetadata {
    contract?: new () => any;
    summary?: string;
    schema?: RouterSchema;
    exposeFilters?: boolean;
    exclude?: boolean;
    externalDocs?: string;
    docs?: {
        body?: object;
        headers?: object;
        return?: object;
    };
}

export enum RouterSchema {
    GetAll,
    GetByID,
    GetIn,
    Raw,
    Insert,
    Update,
    Delete,
    Import,
    Export,
}

/**
 * Get method decorator
 * @param metadata - The metadata
 * @returns The method decorator
 */
export function Get(metadata?: RouterMetadata): MethodDecorator;
export function Get(path: string, metadata?: RouterMetadata): MethodDecorator;
export function Get(
    pathOrMetadata?: string | RouterMetadata,
    metadata?: RouterMetadata,
): MethodDecorator {
    if (typeof pathOrMetadata === 'object')
        return createMethodDecorator(
            'get',
            '',
            undefined,
            pathOrMetadata as RouterMetadata,
        );

    return createMethodDecorator(
        'get',
        pathOrMetadata ?? '',
        undefined,
        metadata,
    );
}

/**
 * Post method decorator
 * @param metadata - The metadata
 * @returns The method decorator
 */
export function Post(metadata?: RouterMetadata): MethodDecorator;
export function Post(path: string, metadata?: RouterMetadata): MethodDecorator;
export function Post(
    pathOrMetadata?: string | RouterMetadata,
    metadata?: RouterMetadata,
): MethodDecorator {
    if (typeof pathOrMetadata === 'object')
        return createMethodDecorator(
            'post',
            '',
            undefined,
            pathOrMetadata as RouterMetadata,
        );

    return createMethodDecorator(
        'post',
        pathOrMetadata ?? '',
        undefined,
        metadata,
    );
}

/**
 * Put method decorator
 * @param metadata - The metadata
 * @returns The method decorator
 */
export function Put(metadata?: RouterMetadata): MethodDecorator;
export function Put(path: string, metadata?: RouterMetadata): MethodDecorator;
export function Put(
    pathOrMetadata?: string | RouterMetadata,
    metadata?: RouterMetadata,
): MethodDecorator {
    if (typeof pathOrMetadata === 'object')
        return createMethodDecorator(
            'put',
            '',
            undefined,
            pathOrMetadata as RouterMetadata,
        );

    return createMethodDecorator(
        'put',
        pathOrMetadata ?? '',
        undefined,
        metadata,
    );
}

/**
 * Delete method decorator
 * @param metadata - The metadata
 * @returns The method decorator
 */
export function Delete(metadata?: RouterMetadata): MethodDecorator;
export function Delete(
    path: string,
    metadata?: RouterMetadata,
): MethodDecorator;
export function Delete(
    pathOrMetadata?: string | RouterMetadata,
    metadata?: RouterMetadata,
): MethodDecorator {
    if (typeof pathOrMetadata === 'object')
        return createMethodDecorator(
            'delete',
            '',
            undefined,
            pathOrMetadata as RouterMetadata,
        );

    return createMethodDecorator(
        'delete',
        pathOrMetadata ?? '',
        undefined,
        metadata,
    );
}

/**
 * Patch method decorator
 * @param metadata - The metadata
 * @returns The method decorator
 */
export function Patch(metadata?: RouterMetadata): MethodDecorator;
export function Patch(path: string, metadata?: RouterMetadata): MethodDecorator;
export function Patch(
    pathOrMetadata?: string | RouterMetadata,
    metadata?: RouterMetadata,
): MethodDecorator {
    if (typeof pathOrMetadata === 'object')
        return createMethodDecorator(
            'patch',
            '',
            undefined,
            pathOrMetadata as RouterMetadata,
        );

    return createMethodDecorator(
        'patch',
        pathOrMetadata ?? '',
        undefined,
        metadata,
    );
}

/**
 * Create a parameter decorator
 * @param paramType - The parameter type
 * @returns The parameter decorator
 */
function createParamDecorator(paramType: string): ParameterDecorator {
    return (target, propertyKey: string | symbol, parameterIndex: number) => {
        const paramName =
            paramType.startsWith('param') ||
            paramType.startsWith('query') ||
            paramType.startsWith('header')
                ? paramType.split(':')[1]
                : paramType;
        ControllerRegistry.registerParam(
            target,
            propertyKey as string,
            paramType,
            parameterIndex,
            paramName,
        );
    };
}

/**
 * Body parameter decorator
 * @returns The parameter decorator
 */
export function Body(): ParameterDecorator {
    return createParamDecorator('body');
}

/**
 * Queries parameter decorator
 * @returns The parameter decorator
 */
export function Queries(): ParameterDecorator {
    return createParamDecorator(`queries`);
}

/**
 * Param parameter decorator
 * @param paramName - The parameter name
 * @returns The parameter decorator
 */
export function Param(paramName: string): ParameterDecorator {
    return createParamDecorator(`param:${paramName}`);
}

/**
 * Query parameter decorator
 * @param queryName - The query name
 * @returns The parameter decorator
 */
export function Query(queryName: string): ParameterDecorator {
    return createParamDecorator(`query:${queryName}`);
}

/**
 * Header parameter decorator
 * @param headerName - The header name
 * @returns The parameter decorator
 */
export function Header(headerName: string): ParameterDecorator {
    return createParamDecorator(`header:${headerName}`);
}

/**
 * Headers parameter decorator
 * @returns The parameter decorator
 */
export function Headers(): ParameterDecorator {
    return createParamDecorator(`headers`);
}

/**
 * Request parameter decorator
 * @returns The parameter decorator
 */
export function Request(): ParameterDecorator {
    return createParamDecorator(`request`);
}

/**
 * Req parameter decorator
 * @returns The parameter decorator
 */
export function Req(): ParameterDecorator {
    return createParamDecorator(`request`);
}

/**
 * Response parameter decorator
 * @returns The parameter decorator
 */
export function Response(): ParameterDecorator {
    return createParamDecorator(`response`);
}

/**
 * Res parameter decorator
 * @returns The parameter decorator
 */
export function Res(): ParameterDecorator {
    return createParamDecorator(`response`);
}

/**
 * Next parameter decorator
 * @returns The parameter decorator
 */
export function Next(): ParameterDecorator {
    return createParamDecorator(`next`);
}

/**
 * Session parameter decorator
 * @returns The parameter decorator
 */
export function Session(): ParameterDecorator {
    return createParamDecorator(`session`);
}

/**
 * User parameter decorator
 * @returns The parameter decorator
 */
export function User(): ParameterDecorator {
    return createParamDecorator(`user`);
}

/**
 * Ip parameter decorator
 * @returns The parameter decorator
 */
export function Ip(): ParameterDecorator {
    return createParamDecorator(`ip`);
}

/**
 * Host parameter decorator
 * @returns The parameter decorator
 */
export function HostParam(): ParameterDecorator {
    return createParamDecorator(`hosts`);
}

/**
 * Uploaded file parameter decorator
 * @param fieldName - The field name
 * @returns The parameter decorator
 */
export function UploadedFile(fieldName?: string): ParameterDecorator {
    return createParamDecorator(fieldName ? `file:${fieldName}` : 'file');
}

/**
 * Uploaded files parameter decorator
 * @returns The parameter decorator
 */
export function UploadedFiles(): ParameterDecorator {
    return createParamDecorator('files');
}
