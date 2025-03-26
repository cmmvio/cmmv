export declare class ServiceRegistry {
    private static services;
    static registerService(target: any, name: string): void;
    static getServices(): [any, {
        name: string;
    }][];
    static getServicesArr(): {};
    static getService(name: string): any;
    static clear(): void;
}
