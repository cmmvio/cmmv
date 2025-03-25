import { RPCRegistry } from './rpc.registry';

export function Rpc(contract: string = ''): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata('rpc_contract', contract, target);
        RPCRegistry.registerController(target, contract);
    };
}

function createMessageDecorator(message: string): MethodDecorator {
    return (target, propertyKey: string | symbol) => {
        RPCRegistry.registerMessageHandler(
            target,
            message,
            propertyKey as string,
        );
    };
}

export function Message(message: string): MethodDecorator {
    return createMessageDecorator(message);
}

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
