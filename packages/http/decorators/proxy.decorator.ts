import { proxy, ProxyOptions } from '@cmmv/proxy';
import { createRouteMiddleware } from './route-middleware.util';

export function Proxy(options: ProxyOptions): MethodDecorator {
    return (_target, _propertyKey: string | symbol, descriptor: any) => {
        createRouteMiddleware(proxy(options), descriptor);
    };
}
