import { v4 as uuidv4 } from 'uuid';
import { plainToClass } from 'class-transformer';

import {
    AbstractHttpAdapter,
    AbstractWSAdapter,
    Application,
    Logger,
} from '@cmmv/core';

import { ProtoRegistry } from '@cmmv/protobuf';
import { RPCRegistry } from './rpc.registry';

const { WebSocketServer } = require('ws');

export class WSCall {
    contract: number;
    message: number;
    data: Uint8Array;
}

export class WSAdapter extends AbstractWSAdapter {
    private logger: Logger = new Logger('WSAdapter');

    private application: Application;
    protected wsServer: typeof WebSocketServer | null = null;

    private registeredMessages: Map<
        string,
        { instance: any; handlerName: string; params: any[] }
    > = new Map();

    create(
        server: AbstractHttpAdapter,
        application: Application,
        options?: any,
    ) {
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
            const id = uuidv4();
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

    bindClientConnect(server, callback: Function) {
        server.on('connection', callback);
    }

    bindCustomMessageHandler(server, callback: Function) {
        server.on('message', callback);
    }

    interceptor(socket, data) {
        const message = plainToClass(
            WSCall,
            ProtoRegistry.retrieve('ws')?.lookupType('WsCall').decode(data),
        );

        const contract = ProtoRegistry.retrieveByIndex(message.contract);
        const typeName = ProtoRegistry.retrieveTypes(
            message.contract,
            message.message,
        );

        if (contract && this.registeredMessages.has(typeName)) {
            const { instance, handlerName, params } =
                this.registeredMessages.get(typeName);
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
            } catch (e) {
                this.logger.error(e.message);
            }
        }
    }

    private registerGateways() {
        const controllers = RPCRegistry.getControllers();

        controllers.forEach(([controllerClass, metadata]) => {
            const paramTypes =
                Reflect.getMetadata('design:paramtypes', controllerClass) || [];
            const instances = paramTypes.map((paramType: any) =>
                this.application.providersMap.get(paramType.name),
            );
            const instance = new controllerClass(...instances);

            metadata.messages.forEach((messageMetadata: any) => {
                const { message, handlerName, params } = messageMetadata;
                this.registeredMessages.set(message, {
                    instance,
                    handlerName,
                    params,
                });
            });
        });
    }

    public close() {
        this.wsServer.close();
    }
}
