import { createRouteMiddleware } from './route-middleware.util';

/**
 * Set the last modified header
 * @param date - The date
 * @returns The last modified decorator
 */
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
