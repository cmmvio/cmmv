export declare class RpcUtils {
    static generateBuffer(protoFile: string, namespace: string, data: any): Promise<Uint8Array>;
    static pack(contractName: string, messageName: string, data?: any): Promise<Uint8Array | null>;
    static error(message: string, code?: number, context?: string): Promise<Uint8Array<ArrayBufferLike>>;
}
