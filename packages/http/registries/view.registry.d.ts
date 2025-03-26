import { Singleton } from '@cmmv/core';
export declare class ViewRegistry extends Singleton {
    styles: Map<string, any>;
    static load(): Promise<void>;
    static register(name: string, style: any): void;
    static retrieve(key: string): any | null;
    static retrieveAll(): object;
}
