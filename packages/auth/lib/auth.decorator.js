"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = Auth;
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const core_1 = require("@cmmv/core");
const http_1 = require("@cmmv/http");
const sessions_service_1 = require("../services/sessions.service");
const auth_utils_1 = require("./auth.utils");
function Auth(rolesOrSettings) {
    return (target, propertyKey, descriptor) => {
        const middlewareAuth = async (request, response, next) => {
            const logger = new core_1.Logger('Auth');
            const cookieName = core_1.Config.get('server.session.options.sessionCookieName', 'token');
            const sessionEnabled = core_1.Config.get('server.session.enabled', true);
            const refreshCookieName = core_1.Config.get('auth.refreshCookieName', 'refreshToken');
            const logging = core_1.Config.get('server.logging', 'all');
            let sessionId = request.cookies
                ? request.cookies[cookieName]
                : null;
            let refreshToken = request.cookies
                ? request.cookies[refreshCookieName]
                : null;
            let token = null;
            if (sessionEnabled && request.session) {
                const session = await request.session.get(sessionId);
                if (session)
                    token = session.user.token;
            }
            const baseLog = {
                context: 'AUTH',
                level: 'WARNING',
                timestamp: Date.now(),
                metadata: {
                    method: request.method.toUpperCase(),
                    path: request.path,
                    token,
                    refreshToken,
                    sessionId,
                    ip: request.req.socket.remoteAddress,
                    agent: request.req.headers['user-agent'],
                },
            };
            if (!token) {
                token =
                    request.req.headers.authorization?.split(' ')[1] || null;
                if (token === 'null' || token === 'undefined')
                    token = null;
            }
            if (!token) {
                if (logging === 'all' ||
                    logging === 'error' ||
                    logging === 'warning') {
                    logger.warning(`${request.method.toUpperCase()} ${request.path} (0ms) 401 - ${request.req.socket.remoteAddress}`);
                }
                core_1.Hooks.execute(core_1.HooksType.Log, {
                    message: `Unauthorized: method="${request.method.toUpperCase()}" path="${request.path}" reason="No token provided"`,
                    ...baseLog,
                });
                return response.code(401).end('Unauthorized');
            }
            const jwtSecret = core_1.Config.get('auth.jwtSecret');
            if (token !== null) {
                jwt.verify(token, jwtSecret, async (err, decoded) => {
                    if (err || !decoded) {
                        if (logging === 'all' ||
                            logging === 'error' ||
                            logging === 'warning') {
                            logger.warning(`${request.method.toUpperCase()} ${request.path} (0ms) 401 - ${request.req.socket.remoteAddress}`);
                        }
                        core_1.Hooks.execute(core_1.HooksType.Log, {
                            message: `Unauthorized: method="${request.method.toUpperCase()}" path="${request.path}" reason="Expired or invalid token"`,
                            ...baseLog,
                        });
                        if (!refreshToken ||
                            !(await sessions_service_1.AuthSessionsService.validateRefreshToken(refreshToken))) {
                            return response.code(401).end('Unauthorized');
                        }
                    }
                    decoded.username = (0, auth_utils_1.decryptJWTData)(decoded.username, jwtSecret);
                    try {
                        const settings = rolesOrSettings;
                        if (settings.rootOnly && !decoded.root)
                            return response.code(401).end('Unauthorized');
                    }
                    catch { }
                    if (decoded.root !== true) {
                        if (!(await sessions_service_1.AuthSessionsService.validateSession(decoded))) {
                            core_1.Hooks.execute(core_1.HooksType.Log, {
                                message: `Unauthorized: method="${request.method.toUpperCase()}" path="${request.path}" reason="Invalid session"`,
                                ...baseLog,
                            });
                            return response.code(401).end('Unauthorized');
                        }
                        if ((rolesOrSettings &&
                            Array.isArray(rolesOrSettings) &&
                            (!decoded.roles ||
                                !rolesOrSettings.some((role) => decoded?.roles.includes(role)))) ||
                            (typeof rolesOrSettings == 'string' &&
                                !decoded?.roles.includes(rolesOrSettings))) {
                            if (logging === 'all' ||
                                logging === 'error' ||
                                logging === 'warning') {
                                logger.warning(`${request.method.toUpperCase()} ${request.path} (0ms) 401 - ${request.req.socket.remoteAddress}`);
                            }
                            core_1.Hooks.execute(core_1.HooksType.Log, {
                                message: `Unauthorized: method="${request.method.toUpperCase()}" path="${request.path}" reason="Invalid permissions"`,
                                ...baseLog,
                            });
                            return response.code(401).end('Unauthorized');
                        }
                        else if (rolesOrSettings) {
                            try {
                                const settings = rolesOrSettings;
                                if (settings.roles &&
                                    Array.isArray(settings.roles)) {
                                    if (!decoded.roles ||
                                        !settings.roles.some((role) => decoded.roles.includes(role))) {
                                        if (logging === 'all' ||
                                            logging === 'error' ||
                                            logging === 'warning') {
                                            logger.warning(`${request.method.toUpperCase()} ${request.path} (0ms) 401 - ${request.req.socket.remoteAddress}`);
                                        }
                                        core_1.Hooks.execute(core_1.HooksType.Log, {
                                            message: `Unauthorized: method="${request.method.toUpperCase()}" path="${request.path}" reason="Invalid permissions"`,
                                            ...baseLog,
                                        });
                                        return response
                                            .code(401)
                                            .end('Unauthorized');
                                    }
                                }
                            }
                            catch (error) {
                                core_1.Hooks.execute(core_1.HooksType.Log, {
                                    message: `Unauthorized: method="${request.method.toUpperCase()}" path="${request.path}" reason="Validation error"`,
                                    ...baseLog,
                                    ...{
                                        metadata: { error: error.message },
                                    },
                                });
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
                    if (decoded.fingerprint !==
                        (0, http_1.generateFingerprint)(request.req, usernameHashed)) {
                        logger.warning(`${request.method.toUpperCase()} ${request.path} (0ms) 403 - ${request.req.socket.remoteAddress}`);
                        core_1.Hooks.execute(core_1.HooksType.Log, {
                            message: `Forbidden: method="${request.method.toUpperCase()}" path="${request.path}" reason="Invalid fingerprint"`,
                            ...baseLog,
                        });
                        return response.code(403).end('Forbidden');
                    }
                    request.user = decoded;
                    next();
                });
            }
            else {
                core_1.Hooks.execute(core_1.HooksType.Log, {
                    message: `Unauthorized: method="${request.method.toUpperCase()}" path="${request.path}" reason="No token provided"`,
                    ...baseLog,
                });
                return response.code(401).end('Unauthorized');
            }
        };
        const existingFields = Reflect.getMetadata('route_metadata', descriptor.value) || {};
        const newField = existingFields?.middleware
            ? { middleware: [...existingFields?.middleware, middlewareAuth] }
            : { middleware: [middlewareAuth] };
        Reflect.defineMetadata('route_metadata', { ...existingFields, ...newField }, descriptor.value);
    };
}
