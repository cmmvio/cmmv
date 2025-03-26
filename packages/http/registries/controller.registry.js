"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerRegistry = void 0;
const core_1 = require("@cmmv/core");
class ControllerRegistry {
    static registerController(target, prefix, context) {
        if (!this.controllers.has(target))
            this.controllers.set(target, { prefix, routes: [] });
        else {
            const data = this.controllers.get(target);
            this.controllers.set(target, { ...data, prefix });
            data.routes.forEach((route) => {
                if (route.context)
                    core_1.Scope.set(`${route.method}::/${prefix}${route.path ? '/' + route.path : ''}`.toLocaleLowerCase(), route.context);
            });
        }
    }
    static registerRoute(target, method, path, handlerName, context, cb, metadata) {
        let controller = this.controllers.get(target.constructor);
        const logger = new core_1.Logger(target.constructor.name);
        if (!controller) {
            const prefix = Reflect.getMetadata('controller_prefix', target.constructor) ||
                '';
            this.registerController(target.constructor, prefix, context);
            controller = this.controllers.get(target.constructor);
        }
        if (controller) {
            const route = controller.routes.find((route) => route.handlerName === handlerName);
            if (context) {
                core_1.Scope.set(`${method}::/${controller.prefix}${path ? '/' + path : ''}`.toLocaleLowerCase(), context);
            }
            let middleWares = null;
            if (context) {
                const existingFields = Reflect.getMetadata('route_metadata', context) || {};
                middleWares = existingFields.middleware;
            }
            if (!route) {
                controller.routes.push({
                    method,
                    path,
                    handlerName,
                    prefix: controller.prefix,
                    params: [],
                    context,
                    cb,
                    middlewares: middleWares,
                    metadata,
                });
            }
            else {
                route.method = method;
                route.path = path;
                route.prefix = controller.prefix;
                route.context = context;
                route.cb = cb;
                route.middlewares = middleWares;
                route.metadata = { ...route.metadata, ...metadata };
            }
        }
    }
    static registerParam(target, handlerName, paramType, index, paramName) {
        let controller = this.controllers.get(target.constructor);
        if (!controller) {
            const prefix = Reflect.getMetadata('controller_prefix', target.constructor) ||
                '';
            this.registerController(target.constructor, prefix);
            controller = this.controllers.get(target.constructor);
        }
        if (controller) {
            let route = controller.routes.find((route) => route.handlerName === handlerName);
            if (!route) {
                route = {
                    method: '',
                    path: '',
                    handlerName,
                    params: [],
                    cb: null,
                };
                controller.routes.push(route);
            }
            route.params = route.params || [];
            route.params.push({ paramType, index, paramName });
        }
        else {
            console.log(`${target.constructor.name} not found`);
        }
    }
    static setMiddleware(target, method, path, handlerName, middleware) {
        const key = `${method}::/${target.constructor.name}/${path}`;
        if (!this.middlewares.has(key))
            this.middlewares.set(key, []);
        this.middlewares.get(key).push(middleware);
    }
    static getMiddlewares(target, method, path) {
        const key = `${method}::/${target.name}/${path}`;
        return this.middlewares.get(key) || [];
    }
    static getControllers() {
        return Array.from(this.controllers.entries());
    }
    static getRoutes(target) {
        const controller = this.controllers.get(target);
        return controller ? controller.routes : [];
    }
    static getParams(target, handlerName) {
        const controller = this.controllers.get(target.constructor);
        if (!controller)
            return [];
        const route = controller.routes.find((route) => route.handlerName === handlerName);
        return route ? route.params : [];
    }
    static clear() {
        ControllerRegistry.controllers = new Map();
    }
}
exports.ControllerRegistry = ControllerRegistry;
ControllerRegistry.controllers = new Map();
ControllerRegistry.middlewares = new Map();
