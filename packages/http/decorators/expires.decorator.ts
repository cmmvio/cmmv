import { createRouteMiddleware } from './route-middleware.util';

/**
 * Set the expires header
 * @param seconds - The number of seconds
 * @returns The expires decorator
 */
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
