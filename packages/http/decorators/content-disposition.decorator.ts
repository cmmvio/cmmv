import { createRouteMiddleware } from './route-middleware.util';

export function ContentDisposition(value: string): MethodDecorator {
    return (target, propertyKey: string | symbol, descriptor: any) => {
        const middleware = async (request: any, response: any, next?: any) => {
            response.setHeader('Content-Disposition', value);
            next?.();
        };

        createRouteMiddleware(middleware, descriptor);
    };
}
