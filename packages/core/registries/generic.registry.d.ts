export declare class GenericRegistry {
    static controllers: Map<any, {
        options?: any;
        handlers: any[];
        properties: {};
        metadata: {};
    }>;
    static registerController(target: any, options: any): void;
    static controllerMetadata(target: any, metadata: object): void;
    static registerHandler(target: any, handlerName: string): void;
    static registerProperty(target: any, propertyName: string | symbol, options?: object, overrideExisting?: boolean): void;
    static registerParam(target: any, handlerName: string, paramType: string, index: number): void;
    static addHandlerMetadata<T>(target: any, handlerName: string, metadata: T): void;
    static addHandlerMetadataArray<T>(target: any, handlerName: string, key: string, value: T): void;
    static getControllers(): [any, {
        options?: any;
        handlers: any[];
        properties: {};
        metadata: {};
    }][];
    static getHandlers(target: any): any[];
    static getParams(target: any, handlerName: string): any[];
    static clear(): void;
}
