import { createRouteMiddleware } from './route-middleware.util';

/**
 * Set the HTTP status code
 * @param statusCode - The status code
 * @returns The HTTP status code decorator
 */
export function HttpCode(statusCode: number): MethodDecorator {
    return (target, propertyKey: string | symbol, descriptor: any) => {
        const middleware = async (request: any, response: any, next?: any) => {
            response.code(statusCode);
            next();
        };

        createRouteMiddleware(middleware, descriptor);
    };
}
