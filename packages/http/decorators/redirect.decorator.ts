import { createRouteMiddleware } from './route-middleware.util';

/**
 * Redirect the request
 * @param url - The URL to redirect to
 * @param statusCode - The status code
 * @returns The redirect decorator
 */
export function Redirect(
    url: string,
    statusCode: 301 | 302 | 307 | 308,
): MethodDecorator {
    return (target, propertyKey: string | symbol, descriptor: any) => {
        const middleware = async (request: any, response: any, next?: any) => {
            if (response?.res) {
                response.res.writeHead(statusCode, { Location: url });
                response.res.end();
            }
        };

        createRouteMiddleware(middleware, descriptor);
    };
}
