import { Singleton } from '../abstracts';
type HookFunction = (...args: any[]) => void | Promise<void>;
export declare enum HooksType {
    'onPreInitialize' = 0,
    'onInitialize' = 1,
    'onListen' = 2,
    'onError' = 3,
    'onHTTPServerInit' = 4,
    'Log' = 5
}
export declare class Hooks extends Singleton {
    private events;
    static add(event: HooksType, fn: HookFunction): void;
    static execute(event: HooksType, ...args: any[]): Promise<void>;
    static has(event: HooksType): boolean;
    static clear(event: HooksType): void;
    static remove(event: HooksType, fn: HookFunction): boolean;
}
export {};
