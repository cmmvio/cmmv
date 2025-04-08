import { createRouteMiddleware } from './route-middleware.util';

export function HttpCode(statusCode: number): MethodDecorator {
    return (target, propertyKey: string | symbol, descriptor: any) => {
        const middleware = async (request: any, response: any, next?: any) => {
            response.code(statusCode);
            next();
        };

        createRouteMiddleware(middleware, descriptor);
    };
}
