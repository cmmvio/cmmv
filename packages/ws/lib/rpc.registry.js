"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCRegistry = void 0;
const core_1 = require("@cmmv/core");
class RPCRegistry {
    static registerController(target, contract) {
        if (!this.controllers.has(target))
            this.controllers.set(target, { contract, messages: [] });
        else
            this.controllers.set(target, {
                ...this.controllers.get(target),
                contract,
            });
    }
    static registerMessageHandler(target, message, handlerName) {
        let controller = this.controllers.get(target.constructor);
        const logger = new core_1.Logger(target.constructor.name);
        if (!controller) {
            const contract = Reflect.getMetadata('rpc_contract', target.constructor) || '';
            this.registerController(target.constructor, contract);
            controller = this.controllers.get(target.constructor);
        }
        if (controller) {
            const handler = controller.messages.find((msg) => msg.handlerName === handlerName);
            if (!handler)
                controller.messages.push({ message, handlerName, params: [] });
            else
                handler.message = message;
        }
    }
    static registerParam(target, handlerName, paramType, index) {
        let controller = this.controllers.get(target.constructor);
        if (!controller) {
            const contract = Reflect.getMetadata('rpc_contract', target.constructor) || '';
            this.registerController(target.constructor, contract);
            controller = this.controllers.get(target.constructor);
        }
        if (controller) {
            let handler = controller.messages.find((msg) => msg.handlerName === handlerName);
            if (!handler) {
                handler = { message: '', handlerName, params: [] };
                controller.messages.push(handler);
            }
            handler.params = handler.params || [];
            handler.params.push({ paramType, index });
        }
        else {
            console.log(`${target.constructor.name} not found`);
        }
    }
    static getControllers() {
        return Array.from(this.controllers.entries());
    }
    static getMessages(target) {
        const controller = this.controllers.get(target);
        return controller ? controller.messages : [];
    }
    static getParams(target, handlerName) {
        const controller = this.controllers.get(target.constructor);
        if (!controller) {
            return [];
        }
        const handler = controller.messages.find((msg) => msg.handlerName === handlerName);
        return handler ? handler.params : [];
    }
    static clear() {
        RPCRegistry.controllers = new Map();
    }
}
exports.RPCRegistry = RPCRegistry;
RPCRegistry.controllers = new Map();
