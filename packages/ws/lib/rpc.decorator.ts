import { RPCRegistry } from './rpc.registry';

/**
 * Register a RPC controller
 * @param contract - The contract
 * @returns The RPC decorator
 */
export function Rpc(contract: string = ''): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata('rpc_contract', contract, target);
        RPCRegistry.registerController(target, contract);
    };
}

/**
 * Create a message decorator
 * @param message - The message
 * @returns The message decorator
 */
function createMessageDecorator(message: string): MethodDecorator {
    return (target, propertyKey: string | symbol) => {
        RPCRegistry.registerMessageHandler(
            target,
            message,
            propertyKey as string,
        );
    };
}

/**
 * Create a message decorator
 * @param message - The message
 * @returns The message decorator
 */
export function Message(message: string): MethodDecorator {
    return createMessageDecorator(message);
}

/**
 * Create a data decorator
 * @returns The data decorator
 */
export function Data(): ParameterDecorator {
    return (target, propertyKey: string | symbol, parameterIndex: number) => {
        RPCRegistry.registerParam(
            target,
            propertyKey as string,
            'data',
            parameterIndex,
        );
    };
}

/**
 * Create a socket decorator
 * @returns The socket decorator
 */
export function Socket(): ParameterDecorator {
    return (target, propertyKey: string | symbol, parameterIndex: number) => {
        RPCRegistry.registerParam(
            target,
            propertyKey as string,
            'socket',
            parameterIndex,
        );
    };
}
