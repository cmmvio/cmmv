import { createRouteMiddleware } from './route-middleware.util';

export function LastModified(date: Date | number): MethodDecorator {
    return (target, propertyKey: string | symbol, descriptor: any) => {
        const timestamp = typeof date === 'number' ? new Date(date) : date;
        const utc = timestamp.toUTCString();

        const middleware = async (request: any, response: any, next?: any) => {
            response.setHeader('Last-Modified', utc);
            next?.();
        };

        createRouteMiddleware(middleware, descriptor);
    };
}
