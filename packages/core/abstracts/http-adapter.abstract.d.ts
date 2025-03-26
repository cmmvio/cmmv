import { Application } from '../application';
import { IHTTPSettings, HttpServer, RequestHandler } from '../interfaces';
export declare abstract class AbstractHttpAdapter<TServer = any, TRequest = any, TResponse = any> implements HttpServer<TRequest, TResponse> {
    protected instance?: any;
    protected httpServer: TServer;
    protected application: Application;
    constructor(instance?: any);
    init(application: Application, settings?: IHTTPSettings): Promise<void>;
    use(...args: any[]): Promise<any>;
    get(handler: RequestHandler): any;
    get(path: any, handler: RequestHandler): any;
    post(handler: RequestHandler): any;
    post(path: any, handler: RequestHandler): any;
    head(handler: RequestHandler): any;
    head(path: any, handler: RequestHandler): any;
    delete(handler: RequestHandler): any;
    delete(path: any, handler: RequestHandler): any;
    put(handler: RequestHandler): any;
    put(path: any, handler: RequestHandler): any;
    patch(handler: RequestHandler): any;
    patch(path: any, handler: RequestHandler): any;
    all(handler: RequestHandler): any;
    all(path: any, handler: RequestHandler): any;
    search(handler: RequestHandler): any;
    search(path: any, handler: RequestHandler): any;
    options(handler: RequestHandler): any;
    options(path: any, handler: RequestHandler): any;
    listen(port: string | number, callback?: () => void): any;
    listen(port: string | number, hostname: string, callback?: () => void): any;
    getHttpServer(): any;
    setHttpServer(httpServer: TServer): void;
    setInstance<T = any>(instance: T): void;
    getInstance<T = any>(): T;
    setPublicDir(dirs: string | string[]): void;
    isJson(result: any): boolean;
    close(): void;
}
