import * as protobuf from 'protobufjs';
import { Singleton } from '@cmmv/core';
interface Types {
    [key: string]: any;
}
export declare class ProtoRegistry extends Singleton {
    protos: Map<string, protobuf.Root>;
    index: Map<number, string>;
    contracts: Map<string, string>;
    types: Map<string, Types>;
    static load(): Promise<void>;
    static register(key: string, root: protobuf.Root, contract: string): void;
    static retrieve(key: string): protobuf.Root | null;
    static retrieveIndex(key: string): number | null;
    static retrieveTypes(key: string | number, message: string | number): string | null;
    static retrieveByIndex(index: number): protobuf.Root | null;
    static retrieveContractName(index: number): string;
    static retrieveContract(key: string): string | null;
    static retrieveAll(): object;
}
export {};
