import { Singleton } from '../abstracts';
export declare class Scope extends Singleton {
    private data;
    static set(name: string, data: any): boolean;
    static has(name: string): boolean;
    static get<T = any>(name: string): T | null;
    static clear(name: string): void;
    static addToArray<T = any>(name: string, value: T): boolean;
    static removeFromArray<T = any>(name: string, value: T): boolean;
    static getArray<T = any>(name: string): T[] | null;
    static getArrayFromIndex<T = any>(name: string, index: number): T | null;
}
