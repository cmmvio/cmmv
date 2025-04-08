import { ControllerRegistry } from '../registries/controller.registry';
import { createRouteMiddleware } from './route-middleware.util';

export function Controller(prefix: string = ''): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata('controller_prefix', prefix, target);
        ControllerRegistry.registerController(target, prefix);
    };
}

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

export function Body(): ParameterDecorator {
    return createParamDecorator('body');
}

export function Queries(): ParameterDecorator {
    return createParamDecorator(`queries`);
}

export function Param(paramName: string): ParameterDecorator {
    return createParamDecorator(`param:${paramName}`);
}

export function Query(queryName: string): ParameterDecorator {
    return createParamDecorator(`query:${queryName}`);
}

export function Header(headerName: string): ParameterDecorator {
    return createParamDecorator(`header:${headerName}`);
}

export function Headers(): ParameterDecorator {
    return createParamDecorator(`headers`);
}

export function Request(): ParameterDecorator {
    return createParamDecorator(`request`);
}

export function Req(): ParameterDecorator {
    return createParamDecorator(`request`);
}

export function Response(): ParameterDecorator {
    return createParamDecorator(`response`);
}

export function Res(): ParameterDecorator {
    return createParamDecorator(`response`);
}

export function Next(): ParameterDecorator {
    return createParamDecorator(`next`);
}

export function Session(): ParameterDecorator {
    return createParamDecorator(`session`);
}

export function User(): ParameterDecorator {
    return createParamDecorator(`user`);
}

export function Ip(): ParameterDecorator {
    return createParamDecorator(`ip`);
}

export function HostParam(): ParameterDecorator {
    return createParamDecorator(`hosts`);
}
