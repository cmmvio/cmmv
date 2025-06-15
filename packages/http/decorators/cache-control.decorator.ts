import { createRouteMiddleware } from './route-middleware.util';

type CacheControlOptions = {
    public?: boolean;
    private?: boolean;
    noStore?: boolean;
    noCache?: boolean;
    mustRevalidate?: boolean;
    proxyRevalidate?: boolean;
    immutable?: boolean;
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    staleIfError?: number;
};

/**
 * Set the cache control directives
 * @param options - The cache control options
 * @returns The cache control decorator
 */
export function CacheControl(options: CacheControlOptions): MethodDecorator {
    return (target, propertyKey: string | symbol, descriptor: any) => {
        const directives: string[] = [];

        if (options.public) directives.push('public');
        if (options.private) directives.push('private');
        if (options.noStore) directives.push('no-store');
        if (options.noCache) directives.push('no-cache');
        if (options.mustRevalidate) directives.push('must-revalidate');
        if (options.proxyRevalidate) directives.push('proxy-revalidate');
        if (options.immutable) directives.push('immutable');

        if (typeof options.maxAge === 'number')
            directives.push(`max-age=${options.maxAge}`);
        if (typeof options.sMaxAge === 'number')
            directives.push(`s-maxage=${options.sMaxAge}`);
        if (typeof options.staleWhileRevalidate === 'number')
            directives.push(
                `stale-while-revalidate=${options.staleWhileRevalidate}`,
            );
        if (typeof options.staleIfError === 'number')
            directives.push(`stale-if-error=${options.staleIfError}`);

        const headerValue = directives.join(', ');

        const middleware = async (request: any, response: any, next?: any) => {
            response.setHeader('Cache-Control', headerValue);
            next?.();
        };

        createRouteMiddleware(middleware, descriptor);
    };
}
