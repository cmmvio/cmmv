import * as http from 'node:http';
import * as https from 'node:https';
import { Duplex } from 'node:stream';
import { Logger, AbstractHttpAdapter, IHTTPSettings, Application } from '@cmmv/core';
export declare class DefaultAdapter extends AbstractHttpAdapter<http.Server | https.Server> {
    protected instance?: any;
    protected readonly openConnections: Set<Duplex>;
    protected readonly logger: Logger;
    constructor(instance?: any);
    init(application: Application, settings?: IHTTPSettings): Promise<void>;
    private setStaticServer;
    initHttpServer(options: any): void;
    private trackOpenConnections;
    private closeOpenConnections;
    private setMiddleware;
    private registerControllers;
    private buildRouteArgs;
    listen(bind: string): Promise<void>;
    connected(): any;
    close(): Promise<unknown>;
    printLog(type: string, method: string, path: string, timer: number, status: number, ip: string): void;
    setPublicDir(dirs: string | string[]): void;
}
