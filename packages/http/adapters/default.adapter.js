"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultAdapter = void 0;
const path = require("node:path");
const crypto = require("node:crypto");
const uuid_1 = require("uuid");
const server_1 = require("@cmmv/server");
const compression_1 = require("@cmmv/compression");
const cors_1 = require("@cmmv/cors");
const cookie_parser_1 = require("@cmmv/cookie-parser");
const etag_1 = require("@cmmv/etag");
const helmet_1 = require("@cmmv/helmet");
const core_1 = require("@cmmv/core");
const controller_registry_1 = require("../registries/controller.registry");
const http_exception_1 = require("../lib/http.exception");
class DefaultAdapter extends core_1.AbstractHttpAdapter {
    constructor(instance) {
        super(instance || (0, server_1.default)());
        this.instance = instance;
        this.openConnections = new Set();
        this.logger = new core_1.Logger('HTTP');
    }
    async init(application, settings) {
        let publicDirs = core_1.Config.get('server.publicDirs', [
            'public/views',
        ]);
        const renderEngine = core_1.Config.get('server.render', 'cmmv');
        if (publicDirs.length > 0)
            publicDirs = publicDirs.map((dir) => path.join(process.cwd(), dir));
        this.application = application;
        this.instance = this.instance || (0, server_1.default)();
        if (!core_1.Config.get('server.poweredBy', false))
            this.instance.disable('x-powered-by');
        if (core_1.Config.get('server.compress.enabled', true))
            this.instance.use((0, compression_1.default)({ level: 6 }));
        if (renderEngine === '@cmmv/view' || renderEngine === 'cmmv') {
            for (const publicDir of publicDirs)
                this.instance.use(this.setStaticServer(publicDir));
            //@ts-ignore
            const { CMMVRenderer } = await Promise.resolve().then(() => require('../lib/view.renderview'));
            const render = new CMMVRenderer();
            this.instance.set('views', publicDirs);
            this.instance.set('view engine', 'html');
            this.instance.engine('html', (filePath, options, callback) => {
                render.renderFile(filePath, options, { nonce: options.nonce || '' }, callback);
            });
        }
        else if (renderEngine) {
            this.instance.set('views', publicDirs);
            this.instance.set('view engine', renderEngine);
        }
        this.instance.use((0, cookie_parser_1.default)());
        this.instance.use((0, etag_1.default)({ algorithm: 'fnv1a' }));
        this.instance.use((0, server_1.json)({ limit: '50mb' }));
        this.instance.use((0, server_1.urlencoded)({ limit: '50mb', extended: true }));
        if (core_1.Config.get('server.cors', true)) {
            this.instance.use((0, cors_1.default)({
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                allowedHeaders: ['Content-Type', 'Authorization'],
            }));
        }
        if (core_1.Config.get('server.helmet.enabled', true)) {
            this.instance.use((0, helmet_1.default)(core_1.Config.get('server.helmet.options', {
                contentSecurityPolicy: false,
            })));
        }
        this.setMiddleware();
        this.registerControllers();
        this.initHttpServer(settings);
    }
    setStaticServer(publicDir) {
        return (0, server_1.serverStatic)(publicDir, {
            setHeaders: (res, path) => {
                if (path.endsWith('.html')) {
                    res.setHeader('Cache-Control', 'no-cache');
                }
                else if (path.endsWith('.vue') ||
                    path.endsWith('.cmmv') ||
                    path.endsWith('.cjs')) {
                    res.setHeader('Content-Type', 'text/javascript');
                }
                else {
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                }
            },
        });
    }
    initHttpServer(options) {
        this.httpServer = this.instance.server;
        if (!this.httpServer)
            throw new Error('Unable to start HTTP adapter');
        this.trackOpenConnections();
    }
    trackOpenConnections() {
        this.httpServer.on('connection', (socket) => {
            this.openConnections.add(socket);
            socket.on('close', () => this.openConnections.delete(socket));
        });
    }
    closeOpenConnections() {
        for (const socket of this.openConnections) {
            socket.destroy();
            this.openConnections.delete(socket);
        }
    }
    setMiddleware() {
        this.instance.addHook('onRequest', async (req, res, payload, done) => {
            req.requestId = (0, uuid_1.v4)();
            res.locals = {};
            res.locals.nonce = (0, uuid_1.v4)().substring(0, 8);
            const customHeaders = core_1.Config.get('headers') || {};
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
                }
                else if (typeof headerValue === 'string') {
                    if (headerName === 'Content-Security-Policy')
                        headerValue =
                            headerValue.indexOf('style-src') == -1
                                ? `${headerValue} "nonce-${res.locals.nonce}"`
                                : headerValue;
                }
                res.setHeader(headerName, headerValue);
            }
            if (req.method === 'GET') {
                if (!core_1.Config.get('server.removePolicyHeaders', false)) {
                    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
                    res.setHeader('X-Content-Type-Options', 'nosniff');
                    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
                    res.setHeader('X-XSS-Protection', '0');
                }
            }
            if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
                if (!core_1.Config.get('server.removePolicyHeaders', false)) {
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
            core_1.Telemetry.start('Request Process', req.requestId);
            if ((req.path.indexOf('.html') === -1 &&
                req.path !== '/' &&
                typeof done === 'function') ||
                (req.path === '/' &&
                    this.instance.router.hasRoute(req.method, req.url) &&
                    typeof done === 'function')) {
                return done();
            }
            else if (req.path.indexOf('.html') === -1 &&
                req.path !== '/' &&
                typeof done !== 'function') {
                return null;
            }
            if (typeof done === 'function')
                done(req, res, payload);
        });
    }
    registerControllers() {
        const controllers = controller_registry_1.ControllerRegistry.getControllers();
        controllers.forEach(([controllerClass, metadata]) => {
            const paramTypes = Reflect.getMetadata('design:paramtypes', controllerClass) || [];
            const instances = paramTypes.map((paramType) => this.application.providersMap.get(paramType.name));
            const instance = new controllerClass(...instances);
            const prefix = metadata.prefix;
            const routes = metadata.routes;
            routes.forEach((route) => {
                let fullPath = `/${prefix}${route.path ? '/' + route.path : ''}`;
                fullPath = fullPath.replace(/\/\//g, '/');
                const method = route.method.toLowerCase();
                if (this.instance[method] && fullPath !== '/*') {
                    const handler = async (req, res, next) => {
                        const startTime = Date.now();
                        try {
                            req.contextId = crypto
                                .createHash('md5')
                                .update(`${req.method}::${req.path}`)
                                .digest('hex');
                            if (core_1.Application.appModule.httpInterceptors.length >
                                0) {
                                for (const interceptor of core_1.Application.appModule
                                    .httpInterceptors) {
                                    const breakProcess = await interceptor(`${req.method}::${req.path}`.toLocaleLowerCase(), {
                                        req,
                                        res,
                                        next,
                                        handler: instance[route.handlerName],
                                    });
                                    if (breakProcess)
                                        return;
                                }
                            }
                            const args = this.buildRouteArgs(req, res, next, route.params);
                            core_1.Telemetry.start('Controller Handler', req.requestId);
                            const result = await instance[route.handlerName](...args);
                            core_1.Telemetry.end('Controller Handler', req.requestId);
                            const processingTime = Date.now() - startTime;
                            core_1.Telemetry.end('Request Process', req.requestId);
                            const telemetry = core_1.Telemetry.getTelemetry(req.requestId);
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
                                if (core_1.Application.appModule.httpAfterRender
                                    .length > 0) {
                                    for (const afterRender of core_1.Application
                                        .appModule.httpAfterRender) {
                                        await afterRender(`${req.method}::${req.path}`.toLocaleLowerCase(), {
                                            req,
                                            res,
                                            next,
                                            handler: instance[route.handlerName],
                                            content: raw,
                                        });
                                    }
                                }
                                this.printLog('log', method, req.path, core_1.Telemetry.getProcessTimer(req.requestId), 200, req.ip);
                                if (typeof result === 'object')
                                    res.json(raw);
                                else
                                    res.send(result);
                            }
                            else if (result) {
                                if (core_1.Application.appModule.httpAfterRender
                                    .length > 0) {
                                    for (const afterRender of core_1.Application
                                        .appModule.httpAfterRender) {
                                        await afterRender(`${req.method}::${req.path}`.toLocaleLowerCase(), {
                                            req,
                                            res,
                                            next,
                                            handler: instance[route.handlerName],
                                            content: result,
                                        });
                                    }
                                }
                                this.printLog('log', method, req.path, core_1.Telemetry.getProcessTimer(req.requestId), 200, req.ip);
                                res.send(result);
                            }
                        }
                        catch (error) {
                            this.logger.error(error.message || 'Internal Server Error');
                            const processingTime = Date.now() - startTime;
                            core_1.Telemetry.end('Request Process', req.requestId);
                            const telemetry = core_1.Telemetry.getTelemetry(req.requestId);
                            let statusCode = 500;
                            if (error instanceof http_exception_1.HttpException)
                                statusCode = error.status;
                            const response = JSON.stringify({
                                status: statusCode,
                                processingTime,
                                message: error.message || 'Internal Server Error',
                            });
                            if (req.query.debug) {
                                response['requestId'] = req.requestId;
                                response['telemetry'] = telemetry;
                            }
                            this.printLog('error', method, req.path, core_1.Telemetry.getProcessTimer(req.requestId), statusCode, req.ip);
                            res.set('content-type', 'text/json')
                                .code(statusCode)
                                .send(response);
                        }
                        core_1.Telemetry.clearTelemetry(req.requestId);
                    };
                    if (route.middlewares) {
                        this.instance[method](fullPath, async (req, res, next) => {
                            try {
                                if (Array.isArray(route.middlewares) &&
                                    route.middlewares.length > 0) {
                                    for (const middleware of route.middlewares) {
                                        await new Promise((resolve, reject) => {
                                            middleware(req, res, (err) => {
                                                if (err)
                                                    return reject(err);
                                                resolve(null);
                                            });
                                        });
                                    }
                                }
                                await handler(req, res, next);
                            }
                            catch (error) {
                                console.error('Error processing middlewares or handler:', error);
                                next(error); // Pass error to the next middleware or error handler
                            }
                        });
                    }
                    else {
                        this.instance[method](fullPath, handler);
                    }
                }
            });
        });
    }
    buildRouteArgs(req, res, next, params) {
        const args = [];
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
                    args[param.index] = req.ip;
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
    listen(bind) {
        return new Promise((resolve, reject) => {
            const [host, port] = bind.split(':');
            this.instance
                .listen({ port: parseInt(port, 10), host })
                .then((server) => resolve())
                .catch((err) => reject(err));
        });
    }
    connected() {
        return this.instance.enabled;
    }
    close() {
        this.closeOpenConnections();
        if (!this.httpServer)
            return undefined;
        return new Promise(async (resolve, reject) => {
            if (this.connected()) {
                try {
                    this.httpServer.close((err) => {
                        if (err)
                            reject(err);
                        else
                            resolve('');
                    });
                }
                catch (err) {
                    reject(err);
                }
            }
            else {
                resolve('');
            }
        });
    }
    printLog(type, method, path, timer, status, ip) {
        const logging = core_1.Config.get('server.logging', 'all');
        const logContent = `${method.toUpperCase()} ${path} (${timer}ms) ${status} ${ip}`;
        switch (type) {
            case 'error':
                if (logging === 'all' || logging === 'error')
                    this.logger.error(logContent);
                break;
            case 'warning':
                if (logging === 'all' ||
                    logging === 'error' ||
                    logging === 'warning')
                    this.logger.warning(logContent);
                break;
            case 'verbose':
                if (logging === 'all' ||
                    logging === 'error' ||
                    logging === 'warning' ||
                    logging === 'verbose')
                    this.logger.verbose(logContent);
                break;
            default:
                this.logger.log(logContent);
                break;
        }
    }
    setPublicDir(dirs) {
        const dirArr = typeof dirs === 'string' ? [dirs] : dirs;
        const currentViews = this.instance.get('views');
        if (Array.isArray(currentViews) &&
            Array.isArray(dirArr) &&
            dirArr.length > 0) {
            const newList = [...currentViews, ...dirArr];
            for (const publicDir of dirArr)
                this.instance.use(this.setStaticServer(publicDir));
            this.instance.set('views', newList);
        }
    }
}
exports.DefaultAdapter = DefaultAdapter;
