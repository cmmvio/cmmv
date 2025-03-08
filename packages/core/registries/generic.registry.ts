const META_OPTIONS = Symbol('controller_options');

export class GenericRegistry {
    public static controllers = new Map<
        any,
        {
            options?: any;
            handlers: any[];
            properties: {};
            metadata: {};
        }
    >();

    public static registerController(target: any, options: any) {
        if (!this.controllers.has(target)) {
            this.controllers.set(target, {
                handlers: [],
                properties: {},
                metadata: {},
                options,
            });
        } else {
            const existingController = this.controllers.get(target);
            this.controllers.set(target, { ...existingController, options });
        }
    }

    public static controllerMetadata(target: any, metadata: object) {
        let controller = this.controllers.get(target.constructor);

        if (!controller) {
            const options =
                Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }

        if (controller) {
            controller.metadata = { ...controller.metadata, ...metadata };
            this.controllers.set(target.constructor, controller);
        }
    }

    public static registerHandler(target: any, handlerName: string) {
        let controller = this.controllers.get(target.constructor);

        if (!controller) {
            const options =
                Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }

        if (controller) {
            const handlerExists = controller.handlers.some(
                (msg) => msg.handlerName === handlerName,
            );

            if (!handlerExists) {
                controller.handlers.push({
                    handlerName,
                    params: [],
                    metadata: {},
                });
            }
        }
    }

    public static registerProperty(
        target: any,
        propertyName: string | symbol,
        options?: object,
        overrideExisting = true,
    ) {
        let controller = this.controllers.get(target.constructor);

        if (!controller) {
            const options =
                Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }

        if (controller) {
            if (!controller.properties[propertyName] || overrideExisting) {
                controller.properties[propertyName] = { ...options };
            } else {
                controller.properties[propertyName] = {
                    ...controller.properties[propertyName],
                    ...options,
                };
            }
        }
    }

    public static registerParam(
        target: any,
        handlerName: string,
        paramType: string,
        index: number,
    ) {
        let controller = this.controllers.get(target.constructor);

        if (!controller) {
            const options =
                Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }

        if (controller) {
            let handler = controller.handlers.find(
                (msg) => msg.handlerName === handlerName,
            );

            if (!handler) {
                handler = { handlerName, params: [], metadata: {} };
                controller.handlers.push(handler);
            }

            handler.params.push({ paramType, index });
        }
    }

    public static addHandlerMetadata<T>(
        target: any,
        handlerName: string,
        metadata: T,
    ) {
        let controller = this.controllers.get(target.constructor);

        if (!controller) {
            const options =
                Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }

        if (controller) {
            let handler = controller.handlers.find(
                (msg) => msg.handlerName === handlerName,
            );

            if (!handler) {
                handler = { handlerName, params: [], metadata: {} };
                controller.handlers.push(handler);
            }

            handler.metadata = { ...handler.metadata, ...metadata };
        }
    }

    public static addHandlerMetadataArray<T>(
        target: any,
        handlerName: string,
        key: string,
        value: T,
    ) {
        let controller = this.controllers.get(target.constructor);

        if (!controller) {
            const options =
                Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }

        if (controller) {
            let handler = controller.handlers.find(
                (msg) => msg.handlerName === handlerName,
            );

            if (!handler) {
                handler = { handlerName, params: [], metadata: {} };
                controller.handlers.push(handler);
            }

            if (!handler.metadata[key]) handler.metadata[key] = [];

            if (Array.isArray(handler.metadata[key]))
                handler.metadata[key].push(value);
        }
    }

    public static getControllers() {
        return Array.from(this.controllers.entries());
    }

    public static getHandlers(target: any): any[] {
        const controller = this.controllers.get(target.constructor);
        return controller ? controller.handlers : [];
    }

    public static getParams(target: any, handlerName: string): any[] {
        const queues = this.controllers.get(target.constructor);
        if (!queues) return [];

        const handler = queues.handlers.find(
            (handler) => handler.handlerName === handlerName,
        );

        return handler ? handler.params : [];
    }

    public static clear() {
        this.controllers.clear();
    }
}
