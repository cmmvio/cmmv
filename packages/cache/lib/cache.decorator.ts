import { CacheRegistry } from './cache.registry';

export interface CacheOptions {
    ttl?: number;
    compress?: boolean;
    schema?: any;
}

/**
 * Create a handler decorator
 * @param key - The key
 * @param options - The options
 * @returns The handler decorator
 */
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

/**
 * Create a cache decorator
 * @param key - The key
 * @param options - The options
 * @returns The cache decorator
 */
export function Cache(key: string, options?: CacheOptions): MethodDecorator {
    return createHandlerDecorator(key, options);
}
