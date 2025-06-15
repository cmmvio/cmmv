import { ProtoRegistry } from '@cmmv/protobuf';

export class RpcUtils {
    /**
     * Generate a buffer
     * @param protoFile - The proto file
     * @param namespace - The namespace
     * @param data - The data
     * @returns The buffer
     */
    public static async generateBuffer(
        protoFile: string,
        namespace: string,
        data: any,
    ): Promise<Uint8Array> {
        try {
            const root = ProtoRegistry.retrieve(protoFile);

            if (root) {
                const Schema = root.lookupType(namespace);
                const message = Schema.fromObject(data);
                const buffer = Schema.encode(message).finish();
                return buffer;
            } else {
                return null;
            }
        } catch (e) {
            return null;
        }
    }

    /**
     * Pack a message
     * @param contractName - The contract name
     * @param messageName - The message name
     * @param data - The data
     * @returns The packed message
     */
    public static async pack(
        contractName: string,
        messageName: string,
        data?: any,
    ): Promise<Uint8Array | null> {
        return new Promise((resolve, reject) => {
            try {
                const index = ProtoRegistry.retrieveIndex(contractName);
                const contractRoot = ProtoRegistry.retrieve(contractName);

                if (Number.isInteger(index) && contractRoot) {
                    const contract = contractRoot.lookupType(messageName);
                    const typeName = ProtoRegistry.retrieveTypes(
                        contractName,
                        messageName,
                    );
                    const dataBuffer = contract
                        ? contract.encode(data).finish()
                        : null;

                    const buffer = ProtoRegistry.retrieve('ws')
                        .lookupType('WsCall')
                        .encode({
                            contract: index,
                            message: typeName,
                            data: dataBuffer ? dataBuffer : new Uint8Array(),
                        })
                        .finish();

                    resolve(buffer);
                } else {
                    throw Error(`Contract ${contractName} not exists`);
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Pack an error message
     * @param message - The message
     * @param code - The code
     * @param context - The context
     * @returns The packed error message
     */
    public static async error(
        message: string,
        code?: number,
        context?: string,
    ) {
        return await RpcUtils.pack('wserror', 'WsError', {
            message,
            code,
            context,
        });
    }
}
