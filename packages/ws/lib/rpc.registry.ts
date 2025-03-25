import { Logger } from '@cmmv/core';

export class RPCRegistry {
    private static controllers = new Map<
        any,
        { contract: string; messages: any[] }
    >();

    public static registerController(target: any, contract: string) {
        if (!this.controllers.has(target))
            this.controllers.set(target, { contract, messages: [] });
        else
            this.controllers.set(target, {
                ...this.controllers.get(target),
                contract,
            });
    }

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

    public static getControllers() {
        return Array.from(this.controllers.entries());
    }

    public static getMessages(target: any): any[] {
        const controller = this.controllers.get(target);
        return controller ? controller.messages : [];
    }

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

    public static clear() {
        RPCRegistry.controllers = new Map<
            any,
            { contract: string; messages: any[] }
        >();
    }
}
