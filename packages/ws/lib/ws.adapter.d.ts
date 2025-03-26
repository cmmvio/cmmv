import { AbstractHttpAdapter, AbstractWSAdapter, Application } from '@cmmv/core';
declare const WebSocketServer: any;
export declare class WSCall {
    contract: number;
    message: number;
    data: Uint8Array;
}
export declare class WSAdapter extends AbstractWSAdapter {
    private logger;
    private application;
    protected wsServer: typeof WebSocketServer | null;
    private registeredMessages;
    create(server: AbstractHttpAdapter, application: Application, options?: any): any;
    bindClientConnect(server: any, callback: Function): void;
    bindCustomMessageHandler(server: any, callback: Function): void;
    interceptor(socket: any, data: any): void;
    private registerGateways;
    close(): void;
}
export {};
