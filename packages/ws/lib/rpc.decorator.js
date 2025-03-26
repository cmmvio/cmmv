"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rpc = Rpc;
exports.Message = Message;
exports.Data = Data;
exports.Socket = Socket;
const rpc_registry_1 = require("./rpc.registry");
function Rpc(contract = '') {
    return (target) => {
        Reflect.defineMetadata('rpc_contract', contract, target);
        rpc_registry_1.RPCRegistry.registerController(target, contract);
    };
}
function createMessageDecorator(message) {
    return (target, propertyKey) => {
        rpc_registry_1.RPCRegistry.registerMessageHandler(target, message, propertyKey);
    };
}
function Message(message) {
    return createMessageDecorator(message);
}
function Data() {
    return (target, propertyKey, parameterIndex) => {
        rpc_registry_1.RPCRegistry.registerParam(target, propertyKey, 'data', parameterIndex);
    };
}
function Socket() {
    return (target, propertyKey, parameterIndex) => {
        rpc_registry_1.RPCRegistry.registerParam(target, propertyKey, 'socket', parameterIndex);
    };
}
