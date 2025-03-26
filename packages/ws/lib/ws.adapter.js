"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSAdapter = exports.WSCall = void 0;
const uuid_1 = require("uuid");
const class_transformer_1 = require("class-transformer");
const core_1 = require("@cmmv/core");
const protobuf_1 = require("@cmmv/protobuf");
const rpc_registry_1 = require("./rpc.registry");
const { WebSocketServer } = require('ws');
class WSCall {
}
exports.WSCall = WSCall;
class WSAdapter extends core_1.AbstractWSAdapter {
    constructor() {
        super(...arguments);
        this.logger = new core_1.Logger('WSAdapter');
        this.wsServer = null;
        this.registeredMessages = new Map();
    }
    create(server, application, options) {
        this.application = application;
        const wsServer = new WebSocketServer({
            server: server.getHttpServer(),
            perMessageDeflate: {
                zlibDeflateOptions: {
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3,
                },
                serverMaxWindowBits: 10,
                concurrencyLimit: 10,
            },
            ...options,
        });
        this.wsServer = wsServer;
        this.bindClientConnect(wsServer, (socket) => {
            const id = (0, uuid_1.v4)();
            socket.id = id;
            this.application.wSConnections.set(id, socket);
            this.logger.log(`WS Connection: ${id}`);
            socket.on('message', (data) => this.interceptor(socket, data));
            //socket.on("error", () => this.wSConnections.delete(id));
            //socket.on("close", () => this.wSConnections.delete(id));
            //socket.send(stringToArrayBuffer(id), { binary: true });
        });
        this.registerGateways();
        return wsServer;
    }
    bindClientConnect(server, callback) {
        server.on('connection', callback);
    }
    bindCustomMessageHandler(server, callback) {
        server.on('message', callback);
    }
    interceptor(socket, data) {
        const message = (0, class_transformer_1.plainToClass)(WSCall, protobuf_1.ProtoRegistry.retrieve('ws')?.lookupType('WsCall').decode(data));
        const contract = protobuf_1.ProtoRegistry.retrieveByIndex(message.contract);
        const typeName = protobuf_1.ProtoRegistry.retrieveTypes(message.contract, message.message);
        if (contract && this.registeredMessages.has(typeName)) {
            const { instance, handlerName, params } = this.registeredMessages.get(typeName);
            const realMessage = contract
                .lookupType(typeName)
                .decode(message.data);
            const args = params
                .sort((a, b) => a.index - b.index)
                .map((param) => {
                switch (param.paramType) {
                    case 'data':
                        return realMessage;
                    case 'socket':
                        return socket;
                    default:
                        return undefined;
                }
            });
            try {
                instance[handlerName](...args);
            }
            catch (e) {
                this.logger.error(e.message);
            }
        }
    }
    registerGateways() {
        const controllers = rpc_registry_1.RPCRegistry.getControllers();
        controllers.forEach(([controllerClass, metadata]) => {
            const paramTypes = Reflect.getMetadata('design:paramtypes', controllerClass) || [];
            const instances = paramTypes.map((paramType) => this.application.providersMap.get(paramType.name));
            const instance = new controllerClass(...instances);
            metadata.messages.forEach((messageMetadata) => {
                const { message, handlerName, params } = messageMetadata;
                this.registeredMessages.set(message, {
                    instance,
                    handlerName,
                    params,
                });
            });
        });
    }
    close() {
        this.wsServer.close();
    }
}
exports.WSAdapter = WSAdapter;
