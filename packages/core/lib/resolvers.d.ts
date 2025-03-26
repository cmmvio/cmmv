import { Singleton } from '../abstracts';
type ResolverFunction = (...args: any[]) => void | Promise<void>;
export declare class Resolvers extends Singleton {
    private resolvers;
    static add(namespace: string, fn: ResolverFunction): void;
    static execute(namespace: string, ...args: any[]): Promise<void>;
    static has(namespace: string): boolean;
    static clear(namespace: string): void;
    static remove(namespace: string, fn: ResolverFunction): boolean;
}
export {};
