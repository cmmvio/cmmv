import { createRouteMiddleware } from './route-middleware.util';

export function ContentType(type: string): MethodDecorator {
    return (target, propertyKey: string | symbol, descriptor: any) => {
        const middleware = async (request: any, response: any, next?: any) => {
            response.setHeader('Content-Type', type);
            next?.();
        };

        createRouteMiddleware(middleware, descriptor);
    };
}
