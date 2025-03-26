export declare class ControllerRegistry {
    private static controllers;
    private static middlewares;
    static registerController(target: any, prefix: string, context?: any): void;
    static registerRoute(target: any, method: string, path: string, handlerName: string, context?: any, cb?: Function, metadata?: object): void;
    static registerParam(target: any, handlerName: string, paramType: string, index: number, paramName?: string): void;
    static setMiddleware(target: any, method: string, path: string, handlerName: string, middleware: Function): void;
    static getMiddlewares(target: any, method: string, path: string): Function[];
    static getControllers(): [any, {
        prefix: string;
        routes: any[];
    }][];
    static getRoutes(target: any): any[];
    static getParams(target: any, handlerName: string): any[];
    static clear(): void;
}
