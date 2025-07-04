import { proxy, ProxyOptions } from '@cmmv/proxy';
import { createRouteMiddleware } from './route-middleware.util';

/**
 * Proxy the request
 * @param options - The proxy options
 * @returns The proxy decorator
 */
export function Proxy(options: ProxyOptions): MethodDecorator {
    return (_target, _propertyKey: string | symbol, descriptor: any) => {
        createRouteMiddleware(proxy(options), descriptor);
    };
}
