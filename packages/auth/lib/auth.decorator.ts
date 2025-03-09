import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import { Config, Logger } from '@cmmv/core';
import { generateFingerprint } from '@cmmv/http';

import { IAuthSettings, IJWTDecoded } from './auth.interface';
import { AuthSessionsService } from '../services/sessions.service';
import { decryptJWTData } from './auth.utils';

export function Auth(
    rolesOrSettings?: string[] | string | IAuthSettings,
): MethodDecorator {
    return (target, propertyKey: string | symbol, descriptor: any) => {
        const middlewareAuth = async (
            request: any,
            response: any,
            next?: any,
        ) => {
            const logger = new Logger('Auth');

            const cookieName = Config.get(
                'server.session.options.sessionCookieName',
                'token',
            );

            const sessionEnabled = Config.get<boolean>(
                'server.session.enabled',
                true,
            );

            const refreshCookieName = Config.get<string>(
                'auth.refreshCookieName',
                'refreshToken',
            );

            const logging = Config.get<string>('server.logging', 'all');

            let sessionId = request.cookies
                ? request.cookies[cookieName]
                : null;

            let refreshToken = request.cookies
                ? request.cookies[refreshCookieName]
                : null;

            let token = null;

            if (sessionEnabled && request.session) {
                const session = await request.session.get(sessionId);
                if (session) token = session.user.token;
            }

            if (!token) {
                token =
                    request.req.headers.authorization?.split(' ')[1] || null;

                if (token === 'null' || token === 'undefined') token = null;
            }

            if (!token) {
                if (
                    logging === 'all' ||
                    logging === 'error' ||
                    logging === 'warning'
                ) {
                    logger.warning(
                        `${request.method.toUpperCase()} ${request.path} (0ms) 401 - ${request.req.socket.remoteAddress}`,
                    );
                }

                return response.code(401).end('Unauthorized');
            }

            const jwtSecret = Config.get('auth.jwtSecret');

            if (token !== null) {
                jwt.verify(
                    token,
                    jwtSecret,
                    async (err: any, decoded: IJWTDecoded) => {
                        if (err || !decoded) {
                            if (
                                logging === 'all' ||
                                logging === 'error' ||
                                logging === 'warning'
                            ) {
                                logger.warning(
                                    `${request.method.toUpperCase()} ${request.path} (0ms) 401 - ${request.req.socket.remoteAddress}`,
                                );
                            }

                            if (
                                !refreshToken ||
                                !(await AuthSessionsService.validateRefreshToken(
                                    refreshToken,
                                ))
                            ) {
                                return response.code(401).end('Unauthorized');
                            }
                        }

                        decoded.username = decryptJWTData(
                            decoded.username,
                            jwtSecret,
                        );

                        try {
                            const settings = rolesOrSettings as IAuthSettings;

                            if (settings.rootOnly && !decoded.root)
                                return response.code(401).end('Unauthorized');
                        } catch {}

                        if (decoded.root !== true) {
                            if (
                                !(await AuthSessionsService.validateSession(
                                    decoded,
                                ))
                            ) {
                                return response.code(401).end('Unauthorized');
                            }

                            if (
                                (rolesOrSettings &&
                                    Array.isArray(rolesOrSettings) &&
                                    (!decoded.roles ||
                                        !rolesOrSettings.some((role) =>
                                            decoded?.roles.includes(role),
                                        ))) ||
                                (typeof rolesOrSettings == 'string' &&
                                    !decoded?.roles.includes(rolesOrSettings))
                            ) {
                                if (
                                    logging === 'all' ||
                                    logging === 'error' ||
                                    logging === 'warning'
                                ) {
                                    logger.warning(
                                        `${request.method.toUpperCase()} ${request.path} (0ms) 401 - ${request.req.socket.remoteAddress}`,
                                    );
                                }

                                return response.code(401).end('Unauthorized');
                            } else if (rolesOrSettings) {
                                try {
                                    const settings =
                                        rolesOrSettings as IAuthSettings;

                                    if (
                                        settings.roles &&
                                        Array.isArray(settings.roles)
                                    ) {
                                        if (
                                            !decoded.roles ||
                                            !settings.roles.some((role) =>
                                                decoded.roles.includes(role),
                                            )
                                        ) {
                                            if (
                                                logging === 'all' ||
                                                logging === 'error' ||
                                                logging === 'warning'
                                            ) {
                                                logger.warning(
                                                    `${request.method.toUpperCase()} ${request.path} (0ms) 401 - ${request.req.socket.remoteAddress}`,
                                                );
                                            }

                                            return response
                                                .code(401)
                                                .end('Unauthorized');
                                        }
                                    }
                                } catch {
                                    return response
                                        .code(401)
                                        .end('Unauthorized');
                                }
                            }
                        }

                        const usernameHashed = crypto
                            .createHash('sha1')
                            .update(decoded.username)
                            .digest('hex');

                        if (
                            decoded.fingerprint !==
                            generateFingerprint(request.req, usernameHashed)
                        ) {
                            logger.warning(
                                `${request.method.toUpperCase()} ${request.path} (0ms) 403 - ${request.req.socket.remoteAddress}`,
                            );

                            return response.code(403).end('Forbidden');
                        }

                        request.user = decoded;
                        next();
                    },
                );
            } else {
                return response.code(401).end('Unauthorized');
            }
        };

        const existingFields =
            Reflect.getMetadata('route_metadata', descriptor.value) || {};

        const newField = existingFields?.middleware
            ? { middleware: [...existingFields?.middleware, middlewareAuth] }
            : { middleware: [middlewareAuth] };

        Reflect.defineMetadata(
            'route_metadata',
            { ...existingFields, ...newField },
            descriptor.value,
        );
    };
}
