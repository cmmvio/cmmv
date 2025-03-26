export type RequestHandler<TRequest = any, TResponse = any> = (req: TRequest, res: TResponse, next?: Function) => any;
export interface HttpServer<TRequest = any, TResponse = any, ServerInstance = any> {
    use(middlaware: any): any;
    get(handler: RequestHandler<TRequest, TResponse>): any;
    get(path: string, handler: RequestHandler<TRequest, TResponse>): any;
    post(handler: RequestHandler<TRequest, TResponse>): any;
    post(path: string, handler: RequestHandler<TRequest, TResponse>): any;
    head(handler: RequestHandler<TRequest, TResponse>): any;
    head(path: string, handler: RequestHandler<TRequest, TResponse>): any;
    delete(handler: RequestHandler<TRequest, TResponse>): any;
    delete(path: string, handler: RequestHandler<TRequest, TResponse>): any;
    put(handler: RequestHandler<TRequest, TResponse>): any;
    put(path: string, handler: RequestHandler<TRequest, TResponse>): any;
    patch(handler: RequestHandler<TRequest, TResponse>): any;
    patch(path: string, handler: RequestHandler<TRequest, TResponse>): any;
    all(path: string, handler: RequestHandler<TRequest, TResponse>): any;
    all(handler: RequestHandler<TRequest, TResponse>): any;
    options(handler: RequestHandler<TRequest, TResponse>): any;
    options(path: string, handler: RequestHandler<TRequest, TResponse>): any;
    listen(bind: string): Promise<void>;
    getHttpServer(): any;
}
