import { Application } from '../application';

import { IHTTPSettings, HttpServer, RequestHandler } from '../interfaces';

export abstract class AbstractHttpAdapter<
    TServer = any,
    TRequest = any,
    TResponse = any,
> implements HttpServer<TRequest, TResponse>
{
    protected httpServer: TServer;
    protected application: Application;

    constructor(protected instance?: any) {}

    public async init(application: Application, settings?: IHTTPSettings) {}

    public async use(...args: any[]) {
        return this.instance.use(...args);
    }

    public get(handler: RequestHandler);
    public get(path: any, handler: RequestHandler);
    public get(...args: any[]) {
        return this.instance.get(...args);
    }

    public post(handler: RequestHandler);
    public post(path: any, handler: RequestHandler);
    public post(...args: any[]) {
        return this.instance.post(...args);
    }

    public head(handler: RequestHandler);
    public head(path: any, handler: RequestHandler);
    public head(...args: any[]) {
        return this.instance.head(...args);
    }

    public delete(handler: RequestHandler);
    public delete(path: any, handler: RequestHandler);
    public delete(...args: any[]) {
        return this.instance.delete(...args);
    }

    public put(handler: RequestHandler);
    public put(path: any, handler: RequestHandler);
    public put(...args: any[]) {
        return this.instance.put(...args);
    }

    public patch(handler: RequestHandler);
    public patch(path: any, handler: RequestHandler);
    public patch(...args: any[]) {
        return this.instance.patch(...args);
    }

    public all(handler: RequestHandler);
    public all(path: any, handler: RequestHandler);
    public all(...args: any[]) {
        return this.instance.all(...args);
    }

    public search(handler: RequestHandler);
    public search(path: any, handler: RequestHandler);
    public search(...args: any[]) {
        return this.instance.search(...args);
    }

    public options(handler: RequestHandler);
    public options(path: any, handler: RequestHandler);
    public options(...args: any[]) {
        return this.instance.options(...args);
    }

    public listen(port: string | number, callback?: () => void);
    public listen(
        port: string | number,
        hostname: string,
        callback?: () => void,
    );
    public listen(port: any, hostname?: any, callback?: any) {
        return this.instance.listen(port, hostname, callback);
    }

    public getHttpServer(): any {
        return this.httpServer;
    }

    public setHttpServer(httpServer: TServer) {
        this.httpServer = httpServer;
    }

    public setInstance<T = any>(instance: T) {
        this.instance = instance;
    }

    public getInstance<T = any>(): T {
        return this.instance as T;
    }

    public setPublicDir(dirs: string | string[]) {
        const dirArr = typeof dirs === 'string' ? [dirs] : dirs;
        const currentViews = this.instance.get('views');

        if (Array.isArray(currentViews)) {
            const newList = [...currentViews, ...dirArr];
            this.instance.set('views', newList);
        }
    }

    public isJson(result: any): boolean {
        if (typeof result === 'object' && result !== null) return true;

        if (typeof result === 'string') {
            try {
                const parsed = JSON.parse(result);
                return typeof parsed === 'object' && parsed !== null;
            } catch (e) {
                return false;
            }
        }

        return false;
    }

    public close() {
        this.instance.close();
    }
}
