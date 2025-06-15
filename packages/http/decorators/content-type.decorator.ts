import { createRouteMiddleware } from './route-middleware.util';

/**
 * Set the content type
 * @param type - The content type
 * @returns The content type decorator
 */
export function ContentType(type: string): MethodDecorator {
    return (target, propertyKey: string | symbol, descriptor: any) => {
        const middleware = async (request: any, response: any, next?: any) => {
            response.setHeader('Content-Type', type);
            next?.();
        };

        createRouteMiddleware(middleware, descriptor);
    };
}
