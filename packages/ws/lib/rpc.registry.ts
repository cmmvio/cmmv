import { Logger } from '@cmmv/core';

export class RPCRegistry {
    private static controllers = new Map<
        any,
        { contract: string; messages: any[] }
    >();

    /**
     * Register a controller
     * @param target - The target
     * @param contract - The contract
     */
    public static registerController(target: any, contract: string) {
        if (!this.controllers.has(target))
            this.controllers.set(target, { contract, messages: [] });
        else
            this.controllers.set(target, {
                ...this.controllers.get(target),
                contract,
            });
    }

    /**
     * Register a message handler
     * @param target - The target
     * @param message - The message
     * @param handlerName - The handler name
     */
    public static registerMessageHandler(
        target: any,
        message: string,
        handlerName: string,
    ) {
        let controller = this.controllers.get(target.constructor);
        const logger = new Logger(target.constructor.name);

        if (!controller) {
            const contract =
                Reflect.getMetadata('rpc_contract', target.constructor) || '';
            this.registerController(target.constructor, contract);
            controller = this.controllers.get(target.constructor);
        }

        if (controller) {
            const handler = controller.messages.find(
                (msg) => msg.handlerName === handlerName,
            );

            if (!handler)
                controller.messages.push({ message, handlerName, params: [] });
            else handler.message = message;
        }
    }

    /**
     * Register a parameter
     * @param target - The target
     * @param handlerName - The handler name
     * @param paramType - The parameter type
     * @param index - The index
     */
    public static registerParam(
        target: any,
        handlerName: string,
        paramType: string,
        index: number,
    ) {
        let controller = this.controllers.get(target.constructor);

        if (!controller) {
            const contract =
                Reflect.getMetadata('rpc_contract', target.constructor) || '';
            this.registerController(target.constructor, contract);
            controller = this.controllers.get(target.constructor);
        }

        if (controller) {
            let handler = controller.messages.find(
                (msg) => msg.handlerName === handlerName,
            );

            if (!handler) {
                handler = { message: '', handlerName, params: [] };
                controller.messages.push(handler);
            }

            handler.params = handler.params || [];
            handler.params.push({ paramType, index });
        } else {
            console.log(`${target.constructor.name} not found`);
        }
    }

    /**
     * Get the controllers
     * @returns The controllers
     */
    public static getControllers() {
        return Array.from(this.controllers.entries());
    }

    /**
     * Get the messages
     * @param target - The target
     * @returns The messages
     */
    public static getMessages(target: any): any[] {
        const controller = this.controllers.get(target);
        return controller ? controller.messages : [];
    }

    /**
     * Get the parameters
     * @param target - The target
     * @param handlerName - The handler name
     * @returns The parameters
     */
    public static getParams(target: any, handlerName: string): any[] {
        const controller = this.controllers.get(target.constructor);
        if (!controller) {
            return [];
        }

        const handler = controller.messages.find(
            (msg) => msg.handlerName === handlerName,
        );
        return handler ? handler.params : [];
    }

    /**
     * Clear the registry
     */
    public static clear() {
        RPCRegistry.controllers = new Map<
            any,
            { contract: string; messages: any[] }
        >();
    }
}
