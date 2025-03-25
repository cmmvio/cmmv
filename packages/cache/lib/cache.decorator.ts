import { CacheRegistry } from './cache.registry';

export interface CacheOptions {
    ttl?: number;
    compress?: boolean;
    schema?: any;
}

function createHandlerDecorator(
    key: string,
    options?: CacheOptions,
): MethodDecorator {
    return (target, propertyKey: string | symbol, context?: any) => {
        CacheRegistry.registerHandler(
            target,
            key,
            propertyKey as string,
            options,
            context.value,
        );
    };
}

export function Cache(key: string, options?: CacheOptions): MethodDecorator {
    return createHandlerDecorator(key, options);
}
