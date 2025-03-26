export declare class RPCRegistry {
    private static controllers;
    static registerController(target: any, contract: string): void;
    static registerMessageHandler(target: any, message: string, handlerName: string): void;
    static registerParam(target: any, handlerName: string, paramType: string, index: number): void;
    static getControllers(): [any, {
        contract: string;
        messages: any[];
    }][];
    static getMessages(target: any): any[];
    static getParams(target: any, handlerName: string): any[];
    static clear(): void;
}
