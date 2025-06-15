import { Logger, Scope } from '@cmmv/core';

export class ControllerRegistry {
    private static controllers = new Map<
        any,
        { prefix: string; routes: any[] }
    >();

    private static middlewares = new Map<string, Function[]>();

    /**
     * Register a controller
     * @param target - The target
     * @param prefix - The prefix
     * @param context - The context
     */
    public static registerController(
        target: any,
        prefix: string,
        context?: any,
    ) {
        if (!this.controllers.has(target))
            this.controllers.set(target, { prefix, routes: [] });
        else {
            const data = this.controllers.get(target);
            this.controllers.set(target, { ...data, prefix });

            data.routes.forEach((route) => {
                if (route.context)
                    Scope.set(
                        `${route.method}::/${prefix}${route.path ? '/' + route.path : ''}`.toLocaleLowerCase(),
                        route.context,
                    );
            });
        }
    }

    /**
     * Register a route
     * @param target - The target
     * @param method - The method
     * @param path - The path
     * @param handlerName - The handler name
     * @param context - The context
     * @param cb - The callback
     * @param metadata - The metadata
     */
    public static registerRoute(
        target: any,
        method: string,
        path: string,
        handlerName: string,
        context?: any,
        cb?: Function,
        metadata?: object,
    ) {
        let controller = this.controllers.get(target.constructor);
        const logger = new Logger(target.constructor.name);

        if (!controller) {
            const prefix =
                Reflect.getMetadata('controller_prefix', target.constructor) ||
                '';
            this.registerController(target.constructor, prefix, context);
            controller = this.controllers.get(target.constructor);
        }

        if (controller) {
            const route = controller.routes.find(
                (route) => route.handlerName === handlerName,
            );

            if (context) {
                Scope.set(
                    `${method}::/${controller.prefix}${path ? '/' + path : ''}`.toLocaleLowerCase(),
                    context,
                );
            }

            let middleWares = null;

            if (context) {
                const existingFields =
                    Reflect.getMetadata('route_metadata', context) || {};

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
            } else {
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

    /**
     * Register a parameter
     * @param target - The target
     * @param handlerName - The handler name
     * @param paramType - The parameter type
     * @param index - The index
     * @param paramName - The parameter name
     */
    public static registerParam(
        target: any,
        handlerName: string,
        paramType: string,
        index: number,
        paramName?: string,
    ) {
        let controller = this.controllers.get(target.constructor);

        if (!controller) {
            const prefix =
                Reflect.getMetadata('controller_prefix', target.constructor) ||
                '';
            this.registerController(target.constructor, prefix);
            controller = this.controllers.get(target.constructor);
        }

        if (controller) {
            let route = controller.routes.find(
                (route) => route.handlerName === handlerName,
            );

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
        } else {
            console.log(`${target.constructor.name} not found`);
        }
    }

    /**
     * Set a middleware
     * @param target - The target
     * @param method - The method
     * @param path - The path
     * @param handlerName - The handler name
     * @param middleware - The middleware
     */
    public static setMiddleware(
        target: any,
        method: string,
        path: string,
        handlerName: string,
        middleware: Function,
    ) {
        const key = `${method}::/${target.constructor.name}/${path}`;
        if (!this.middlewares.has(key)) this.middlewares.set(key, []);
        this.middlewares.get(key)!.push(middleware);
    }

    /**
     * Get the middlewares
     * @param target - The target
     * @param method - The method
     * @param path - The path
     * @returns The middlewares
     */
    public static getMiddlewares(
        target: any,
        method: string,
        path: string,
    ): Function[] {
        const key = `${method}::/${target.name}/${path}`;
        return this.middlewares.get(key) || [];
    }

    /**
     * Get the controllers
     * @returns The controllers
     */
    public static getControllers() {
        return Array.from(this.controllers.entries());
    }

    /**
     * Get the routes
     * @param target - The target
     * @returns The routes
     */
    public static getRoutes(target: any): any[] {
        const controller = this.controllers.get(target);
        return controller ? controller.routes : [];
    }

    /**
     * Get the parameters
     * @param target - The target
     * @param handlerName - The handler name
     * @returns The parameters
     */
    public static getParams(target: any, handlerName: string): any[] {
        const controller = this.controllers.get(target.constructor);

        if (!controller) return [];

        const route = controller.routes.find(
            (route) => route.handlerName === handlerName,
        );
        return route ? route.params : [];
    }

    /**
     * Clear the controller registry
     */
    public static clear() {
        ControllerRegistry.controllers = new Map<
            any,
            { prefix: string; routes: any[] }
        >();
    }
}
