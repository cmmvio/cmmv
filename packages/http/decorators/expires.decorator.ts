import { createRouteMiddleware } from './route-middleware.util';

export function Expires(seconds: number): MethodDecorator {
    return (target, propertyKey: string | symbol, descriptor: any) => {
        const middleware = async (request: any, response: any, next?: any) => {
            const expiresAt = new Date(
                Date.now() + seconds * 1000,
            ).toUTCString();
            response.setHeader('Expires', expiresAt);
            next?.();
        };

        createRouteMiddleware(middleware, descriptor);
    };
}
