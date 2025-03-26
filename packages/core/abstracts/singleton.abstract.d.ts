export declare abstract class Singleton {
    private static instances;
    static getInstance<T extends Singleton>(this: new () => T): T;
    static clearInstance<T extends Singleton>(this: new () => T): void;
}
