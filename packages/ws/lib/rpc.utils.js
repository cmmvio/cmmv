"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcUtils = void 0;
const protobuf_1 = require("@cmmv/protobuf");
class RpcUtils {
    static async generateBuffer(protoFile, namespace, data) {
        try {
            const root = protobuf_1.ProtoRegistry.retrieve(protoFile);
            if (root) {
                const Schema = root.lookupType(namespace);
                const message = Schema.fromObject(data);
                const buffer = Schema.encode(message).finish();
                return buffer;
            }
            else {
                return null;
            }
        }
        catch (e) {
            return null;
        }
    }
    static async pack(contractName, messageName, data) {
        return new Promise((resolve, reject) => {
            try {
                const index = protobuf_1.ProtoRegistry.retrieveIndex(contractName);
                const contractRoot = protobuf_1.ProtoRegistry.retrieve(contractName);
                if (Number.isInteger(index) && contractRoot) {
                    const contract = contractRoot.lookupType(messageName);
                    const typeName = protobuf_1.ProtoRegistry.retrieveTypes(contractName, messageName);
                    const dataBuffer = contract
                        ? contract.encode(data).finish()
                        : null;
                    const buffer = protobuf_1.ProtoRegistry.retrieve('ws')
                        .lookupType('WsCall')
                        .encode({
                        contract: index,
                        message: typeName,
                        data: dataBuffer ? dataBuffer : new Uint8Array(),
                    })
                        .finish();
                    resolve(buffer);
                }
                else {
                    throw Error(`Contract ${contractName} not exists`);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }
    static async error(message, code, context) {
        return await RpcUtils.pack('wserror', 'WsError', {
            message,
            code,
            context,
        });
    }
}
exports.RpcUtils = RpcUtils;
