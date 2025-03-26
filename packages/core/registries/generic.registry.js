"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericRegistry = void 0;
const META_OPTIONS = Symbol('controller_options');
class GenericRegistry {
    static registerController(target, options) {
        if (!this.controllers.has(target)) {
            this.controllers.set(target, {
                handlers: [],
                properties: {},
                metadata: {},
                options,
            });
        }
        else {
            const existingController = this.controllers.get(target);
            this.controllers.set(target, { ...existingController, options });
        }
    }
    static controllerMetadata(target, metadata) {
        let controller = this.controllers.get(target.constructor);
        if (!controller) {
            const options = Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }
        if (controller) {
            controller.metadata = { ...controller.metadata, ...metadata };
            this.controllers.set(target.constructor, controller);
        }
    }
    static registerHandler(target, handlerName) {
        let controller = this.controllers.get(target.constructor);
        if (!controller) {
            const options = Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }
        if (controller) {
            const handlerExists = controller.handlers.some((msg) => msg.handlerName === handlerName);
            if (!handlerExists) {
                controller.handlers.push({
                    handlerName,
                    params: [],
                    metadata: {},
                });
            }
        }
    }
    static registerProperty(target, propertyName, options, overrideExisting = true) {
        let controller = this.controllers.get(target.constructor);
        if (!controller) {
            const options = Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }
        if (controller) {
            if (!controller.properties[propertyName] || overrideExisting) {
                controller.properties[propertyName] = { ...options };
            }
            else {
                controller.properties[propertyName] = {
                    ...controller.properties[propertyName],
                    ...options,
                };
            }
        }
    }
    static registerParam(target, handlerName, paramType, index) {
        let controller = this.controllers.get(target.constructor);
        if (!controller) {
            const options = Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }
        if (controller) {
            let handler = controller.handlers.find((msg) => msg.handlerName === handlerName);
            if (!handler) {
                handler = { handlerName, params: [], metadata: {} };
                controller.handlers.push(handler);
            }
            handler.params.push({ paramType, index });
        }
    }
    static addHandlerMetadata(target, handlerName, metadata) {
        let controller = this.controllers.get(target.constructor);
        if (!controller) {
            const options = Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }
        if (controller) {
            let handler = controller.handlers.find((msg) => msg.handlerName === handlerName);
            if (!handler) {
                handler = { handlerName, params: [], metadata: {} };
                controller.handlers.push(handler);
            }
            handler.metadata = { ...handler.metadata, ...metadata };
        }
    }
    static addHandlerMetadataArray(target, handlerName, key, value) {
        let controller = this.controllers.get(target.constructor);
        if (!controller) {
            const options = Reflect.getMetadata(META_OPTIONS, target.constructor) || {};
            this.registerController(target.constructor, options);
            controller = this.controllers.get(target.constructor);
        }
        if (controller) {
            let handler = controller.handlers.find((msg) => msg.handlerName === handlerName);
            if (!handler) {
                handler = { handlerName, params: [], metadata: {} };
                controller.handlers.push(handler);
            }
            if (!handler.metadata[key])
                handler.metadata[key] = [];
            if (Array.isArray(handler.metadata[key]))
                handler.metadata[key].push(value);
        }
    }
    static getControllers() {
        return Array.from(this.controllers.entries());
    }
    static getHandlers(target) {
        const controller = this.controllers.get(target.constructor);
        return controller ? controller.handlers : [];
    }
    static getParams(target, handlerName) {
        const queues = this.controllers.get(target.constructor);
        if (!queues)
            return [];
        const handler = queues.handlers.find((handler) => handler.handlerName === handlerName);
        return handler ? handler.params : [];
    }
    static clear() {
        this.controllers.clear();
    }
}
exports.GenericRegistry = GenericRegistry;
GenericRegistry.controllers = new Map();
