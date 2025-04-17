import * as path from 'node:path';
import * as http from 'node:http';
import * as https from 'node:https';
import * as crypto from 'node:crypto';
import { Duplex } from 'node:stream';
import { v4 as uuidv4 } from 'uuid';

import cmmv, { serverStatic, json, urlencoded } from '@cmmv/server';
import compression from '@cmmv/compression';
import cors from '@cmmv/cors';
import cookieParser from '@cmmv/cookie-parser';
import etag from '@cmmv/etag';
import helmet from '@cmmv/helmet';

import {
    Logger,
    AbstractHttpAdapter,
    IHTTPSettings,
    Application,
    Telemetry,
    Config,
} from '@cmmv/core';

import { ControllerRegistry } from '../registries/controller.registry';
import { HttpException } from '../lib/http.exception';

export class DefaultAdapter extends AbstractHttpAdapter<
    http.Server | https.Server
> {
    protected readonly openConnections = new Set<Duplex>();
    protected readonly logger = new Logger('HTTP');

    constructor(protected instance?: any) {
        super(instance || cmmv());
    }

    public async init(application: Application, settings?: IHTTPSettings) {
        let publicDirs = Config.get<string[]>('server.publicDirs', [
            'public/views',
        ]);
        const renderEngine = Config.get<string>('server.render', 'cmmv');

        if (publicDirs.length > 0)
            publicDirs = publicDirs.map((dir) => path.join(process.cwd(), dir));

        this.application = application;
        this.instance = this.instance || cmmv();

        if (!Config.get<boolean>('server.poweredBy', false))
            this.instance.disable('x-powered-by');

        if (Config.get<boolean>('server.compress.enabled', true))
            this.instance.use(compression({ level: 6 }));

        if (renderEngine === '@cmmv/view' || renderEngine === 'cmmv') {
            for (const publicDir of publicDirs)
                this.instance.use(this.setStaticServer(publicDir));

            //@ts-ignore
            const { CMMVRenderer } = await import('../lib/view.renderview');
            const render = new CMMVRenderer();

            this.instance.set('views', publicDirs);
            this.instance.set('view engine', 'html');
            this.instance.engine('html', (filePath, options, callback) => {
                render.renderFile(
                    filePath,
                    options,
                    { nonce: options.nonce || '' },
                    callback,
                );
            });
        } else if (renderEngine) {
            this.instance.set('views', publicDirs);
            this.instance.set('view engine', renderEngine);
        }

        this.instance.use(cookieParser());
        this.instance.use(etag({ algorithm: 'fnv1a' }));
        this.instance.use(json({ limit: '50mb' }));
        this.instance.use(urlencoded({ limit: '50mb', extended: true }));

        if (Config.get<boolean>('server.cors', true)) {
            this.instance.use(
                cors({
                    methods: ['GET', 'POST', 'PUT', 'DELETE'],
                    allowedHeaders: ['Content-Type', 'Authorization'],
                }),
            );
        }

        if (Config.get<boolean>('server.helmet.enabled', true)) {
            this.instance.use(
                helmet(
                    Config.get('server.helmet.options', {
                        contentSecurityPolicy: false,
                    }),
                ),
            );
        }

        this.setMiddleware();
        this.registerControllers();
        this.initHttpServer(settings);
    }

    private setStaticServer(publicDir: string) {
        return serverStatic(publicDir, {
            setHeaders: (res, path) => {
                if (path.endsWith('.html')) {
                    res.setHeader('Cache-Control', 'no-cache');
                } else if (
                    path.endsWith('.vue') ||
                    path.endsWith('.cmmv') ||
                    path.endsWith('.cjs')
                ) {
                    res.setHeader('Content-Type', 'text/javascript');
                } else {
                    res.setHeader(
                        'Cache-Control',
                        'public, max-age=31536000, immutable',
                    );
                }
            },
        });
    }

    public initHttpServer(options: any) {
        this.httpServer = this.instance.server;

        if (!this.httpServer) throw new Error('Unable to start HTTP adapter');

        this.trackOpenConnections();
    }

    private trackOpenConnections() {
        this.httpServer.on('connection', (socket: Duplex) => {
            this.openConnections.add(socket);
            socket.on('close', () => this.openConnections.delete(socket));
        });
    }

    private closeOpenConnections() {
        for (const socket of this.openConnections) {
            socket.destroy();
            this.openConnections.delete(socket);
        }
    }

    private setMiddleware() {
        this.instance.addHook('onRequest', async (req, res, payload, done) => {
            req.requestId = uuidv4();
            res.locals = {};
            res.locals.nonce = uuidv4().substring(0, 8);
            const customHeaders = Config.get('headers') || {};

            for (const headerName in customHeaders) {
                let headerValue = customHeaders[headerName];

                if (Array.isArray(headerValue)) {
                    headerValue = headerValue
                        .map((value) => {
                            if (headerName === 'Content-Security-Policy')
                                return value.indexOf('style-src') == -1
                                    ? `${value} "nonce-${res.locals.nonce}"`
                                    : value;

                            return value;
                        })
                        .join('; ');
                } else if (typeof headerValue === 'string') {
                    if (headerName === 'Content-Security-Policy')
                        headerValue =
                            headerValue.indexOf('style-src') == -1
                                ? `${headerValue} "nonce-${res.locals.nonce}"`
                                : headerValue;
                }

                res.setHeader(headerName, headerValue);
            }

            if (req.method === 'GET') {
                if (!Config.get<boolean>('server.removePolicyHeaders', false)) {
                    res.setHeader(
                        'Strict-Transport-Security',
                        'max-age=15552000; includeSubDomains',
                    );
                    res.setHeader('X-Content-Type-Options', 'nosniff');
                    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
                    res.setHeader('X-XSS-Protection', '0');
                }
            }

            if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
                if (!Config.get<boolean>('server.removePolicyHeaders', false)) {
                    res.removeHeader('X-DNS-Prefetch-Control');
                    res.removeHeader('X-Download-Options');
                    res.removeHeader('X-Permitted-Cross-Domain-Policies');
                    res.removeHeader('Strict-Transport-Security');
                    res.removeHeader('Content-Security-Policy');
                    res.removeHeader('Cross-Origin-Opener-Policy');
                    res.removeHeader('Cross-Origin-Resource-Policy');
                    res.removeHeader('Origin-Agent-Cluster');
                    res.removeHeader('Referrer-Policy');
                }
            }

            res.setHeader('cross-origin-resource-policy', 'cross-origin');

            Telemetry.start('Request Process', req.requestId);

            if (
                (req.path.indexOf('.html') === -1 &&
                    req.path !== '/' &&
                    typeof done === 'function') ||
                (req.path === '/' &&
                    this.instance.router.hasRoute(req.method, req.url) &&
                    typeof done === 'function')
            ) {
                return done();
            } else if (
                req.path.indexOf('.html') === -1 &&
                req.path !== '/' &&
                typeof done !== 'function'
            ) {
                return null;
            }

            if (typeof done === 'function') done(req, res, payload);
        });
    }

    private registerControllers() {
        const controllers = ControllerRegistry.getControllers();

        controllers.forEach(([controllerClass, metadata]) => {
            const paramTypes =
                Reflect.getMetadata('design:paramtypes', controllerClass) || [];
            const instances = paramTypes.map((paramType: any) =>
                this.application.providersMap.get(paramType.name),
            );

            const instance = new controllerClass(...instances);
            const prefix = metadata.prefix;
            const routes = metadata.routes;

            routes.forEach((route) => {
                let fullPath = `/${prefix}${route.path ? '/' + route.path : ''}`;
                fullPath = fullPath.replace(/\/\//g, '/');
                const method = route.method.toLowerCase();

                if (this.instance[method] && fullPath !== '/*') {
                    const handler = async (req: any, res: any, next: any) => {
                        const rawData = Config.get<boolean>(
                            'server.rawData',
                            false,
                        );
                        const startTime = Date.now();

                        try {
                            req.contextId = crypto
                                .createHash('md5')
                                .update(`${req.method}::${req.path}`)
                                .digest('hex');

                            if (
                                Application.appModule.httpInterceptors.length >
                                0
                            ) {
                                for (const interceptor of Application.appModule
                                    .httpInterceptors) {
                                    const breakProcess = await interceptor(
                                        `${req.method}::${req.path}`.toLocaleLowerCase(),
                                        {
                                            req,
                                            res,
                                            next,
                                            handler:
                                                instance[route.handlerName],
                                        },
                                    );

                                    if (breakProcess) return;
                                }
                            }

                            const args = this.buildRouteArgs(
                                req,
                                res,
                                next,
                                route.params,
                            );

                            Telemetry.start(
                                'Controller Handler',
                                req.requestId,
                            );

                            const result = await instance[route.handlerName](
                                ...args,
                            );

                            const raw = Reflect.getMetadata(
                                'raw',
                                instance[route.handlerName],
                            );

                            if (raw) {
                                if (typeof result === 'object')
                                    res.json(result);
                                else res.send(result);
                                return;
                            }

                            Telemetry.end('Controller Handler', req.requestId);

                            const processingTime = Date.now() - startTime;
                            Telemetry.end('Request Process', req.requestId);
                            const telemetry = Telemetry.getTelemetry(
                                req.requestId,
                            );

                            if (this.isJson(result)) {
                                const raw = {
                                    status: 200,
                                    processingTime,
                                    result: {
                                        ...result,
                                    },
                                };

                                if (req.query.debug) {
                                    raw['requestId'] = req.requestId;
                                    raw['telemetry'] = telemetry;
                                }

                                if (
                                    Application.appModule.httpAfterRender
                                        .length > 0
                                ) {
                                    for (const afterRender of Application
                                        .appModule.httpAfterRender) {
                                        await afterRender(
                                            `${req.method}::${req.path}`.toLocaleLowerCase(),
                                            {
                                                req,
                                                res,
                                                next,
                                                handler:
                                                    instance[route.handlerName],
                                                content: raw,
                                            },
                                        );
                                    }
                                }

                                this.printLog(
                                    'log',
                                    method,
                                    req.path,
                                    Telemetry.getProcessTimer(req.requestId),
                                    200,
                                    req.ip,
                                );

                                if (typeof result === 'object' && !rawData)
                                    res.json(raw);
                                else res.send(result);
                            } else if (result) {
                                if (
                                    Application.appModule.httpAfterRender
                                        .length > 0
                                ) {
                                    for (const afterRender of Application
                                        .appModule.httpAfterRender) {
                                        await afterRender(
                                            `${req.method}::${req.path}`.toLocaleLowerCase(),
                                            {
                                                req,
                                                res,
                                                next,
                                                handler:
                                                    instance[route.handlerName],
                                                content: result,
                                            },
                                        );
                                    }
                                }

                                this.printLog(
                                    'log',
                                    method,
                                    req.path,
                                    Telemetry.getProcessTimer(req.requestId),
                                    200,
                                    req.ip,
                                );

                                res.send(result);
                            }
                        } catch (error) {
                            this.logger.error(
                                error.message || 'Internal Server Error',
                            );

                            if (process.env.NODE_ENV === 'dev')
                                console.error(error);

                            const processingTime = Date.now() - startTime;
                            Telemetry.end('Request Process', req.requestId);
                            const telemetry = Telemetry.getTelemetry(
                                req.requestId,
                            );
                            let statusCode = 500;

                            if (error instanceof HttpException)
                                statusCode = error.status;

                            const response = JSON.stringify({
                                status: statusCode,
                                processingTime,
                                message:
                                    error.message || 'Internal Server Error',
                            });

                            if (req.query.debug) {
                                response['requestId'] = req.requestId;
                                response['telemetry'] = telemetry;
                            }

                            this.printLog(
                                'error',
                                method,
                                req.path,
                                Telemetry.getProcessTimer(req.requestId),
                                statusCode,
                                req.ip,
                            );

                            res.set('content-type', 'text/json')
                                .code(statusCode)
                                .send(response);
                        }

                        Telemetry.clearTelemetry(req.requestId);
                    };

                    if (route.middlewares) {
                        this.instance[method](
                            fullPath,
                            async (req, res, next) => {
                                try {
                                    if (
                                        Array.isArray(route.middlewares) &&
                                        route.middlewares.length > 0
                                    ) {
                                        for (const middleware of route.middlewares) {
                                            await new Promise(
                                                (resolve, reject) => {
                                                    middleware(
                                                        req,
                                                        res,
                                                        (err) => {
                                                            if (err)
                                                                return reject(
                                                                    err,
                                                                );
                                                            resolve(null);
                                                        },
                                                    );
                                                },
                                            );
                                        }
                                    }

                                    await handler(req, res, next);
                                } catch (error) {
                                    console.error(
                                        'Error processing middlewares or handler:',
                                        error,
                                    );
                                    next(error); // Pass error to the next middleware or error handler
                                }
                            },
                        );
                    } else {
                        this.instance[method](fullPath, handler);
                    }
                }
            });
        });
    }

    private buildRouteArgs(req: any, res: any, next: any, params: any[]) {
        const args: any[] = [];

        params?.forEach((param) => {
            const [paramType, paramName] = param.paramType.split(':');
            switch (paramType) {
                case 'body':
                    args[param.index] = req.body;
                    break;
                case 'param':
                    args[param.index] = req.params[paramName];
                    break;
                case 'query':
                    args[param.index] = req.query[paramName];
                    break;
                case 'queries':
                    args[param.index] = req.query;
                    break;
                case 'header':
                    args[param.index] = req.headers[paramName.toLowerCase()];
                    break;
                case 'headers':
                    args[param.index] = req.headers;
                    break;
                case 'request':
                    args[param.index] = req;
                    break;
                case 'response':
                    args[param.index] = res;
                    break;
                case 'next':
                    args[param.index] = next;
                    break;
                case 'session':
                    args[param.index] = req.session;
                    break;
                case 'user':
                    args[param.index] = req.user;
                    break;
                case 'ip':
                    args[param.index] =
                        req.ip ||
                        req.headers['cf-connecting-ip'] ||
                        req.headers['X-Real-IP'] ||
                        req.headers['X-Forwarded-For'] ||
                        req.connection.remoteAddress;
                    break;
                case 'hosts':
                    args[param.index] = req.hosts;
                    break;
                default:
                    args[param.index] = undefined;
                    break;
            }
        });

        return args;
    }

    public listen(bind: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const [host, port] = bind.split(':');

            this.instance
                .listen({ port: parseInt(port, 10), host })
                .then((server) => resolve())
                .catch((err) => reject(err));
        });
    }

    public connected() {
        return this.instance.enabled;
    }

    public close() {
        this.closeOpenConnections();

        if (!this.httpServer) return undefined;

        return new Promise(async (resolve, reject) => {
            if (this.connected()) {
                try {
                    this.httpServer.close((err) => {
                        if (err) reject(err);
                        else resolve('');
                    });
                } catch (err) {
                    reject(err);
                }
            } else {
                resolve('');
            }
        });
    }

    public printLog(
        type: string,
        method: string,
        path: string,
        timer: number,
        status: number,
        ip: string,
    ) {
        const logging = Config.get<string>('server.logging', 'all');
        const logContent = `${method.toUpperCase()} ${path} (${timer}ms) ${status} ${ip}`;

        switch (type) {
            case 'error':
                if (logging === 'all' || logging === 'error')
                    this.logger.error(logContent);
                break;
            case 'warning':
                if (
                    logging === 'all' ||
                    logging === 'error' ||
                    logging === 'warning'
                )
                    this.logger.warning(logContent);
                break;
            case 'verbose':
                if (
                    logging === 'all' ||
                    logging === 'error' ||
                    logging === 'warning' ||
                    logging === 'verbose'
                )
                    this.logger.verbose(logContent);
                break;
            default:
                this.logger.log(logContent);
                break;
        }
    }

    public setPublicDir(dirs: string | string[]) {
        const dirArr = typeof dirs === 'string' ? [dirs] : dirs;
        const currentViews = this.instance.get('views');

        if (
            Array.isArray(currentViews) &&
            Array.isArray(dirArr) &&
            dirArr.length > 0
        ) {
            const newList = [...currentViews, ...dirArr];

            for (const publicDir of dirArr)
                this.instance.use(this.setStaticServer(publicDir));

            this.instance.set('views', newList);
        }
    }
}
