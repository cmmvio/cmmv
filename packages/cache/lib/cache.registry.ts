import { CacheOptions } from './cache.decorator';

export class CacheRegistry {
    /**
     * Register a handler
     * @param target - The target
     * @param key - The key
     * @param handlerName - The handler name
     * @param options - The options
     * @param context - The context
     */
    public static registerHandler(
        target: any,
        key: string,
        handlerName: string,
        options?: CacheOptions,
        context?: any,
    ) {
        Reflect.defineMetadata(
            'cache_metadata',
            { handler: handlerName, key, options },
            context,
        );
    }
}
