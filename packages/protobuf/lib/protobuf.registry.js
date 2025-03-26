"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtoRegistry = void 0;
const path = require("node:path");
const fs = require("node:fs");
const protobuf = require("protobufjs");
const fg = require("fast-glob");
const core_1 = require("@cmmv/core");
class ProtoRegistry extends core_1.Singleton {
    constructor() {
        super(...arguments);
        this.protos = new Map();
        this.index = new Map();
        this.contracts = new Map();
        this.types = new Map();
    }
    static async load() {
        const directoryPackages = path.resolve(process.env.NODE_ENV === 'prod'
            ? './node_modules/@cmmv/**/*.proto'
            : './packages/**/*.proto');
        const directory = path.resolve(process.env.NODE_ENV === 'prod'
            ? './dist/**/*.proto'
            : './src/**/*.proto');
        const files = await fg([directoryPackages, directory], {
            ignore: ['node_modules/**'],
        });
        for await (const filename of files) {
            if (!filename.includes('node_modules')) {
                const protoName = path.basename(filename);
                const root = await protobuf.load(path.resolve(filename));
                const contract = fs.readFileSync(filename, 'utf-8');
                this.register(protoName.replace('.proto', ''), root, contract);
            }
        }
    }
    static register(key, root, contract) {
        const globalProto = ProtoRegistry.getInstance();
        globalProto.index.set(globalProto.contracts.size, key);
        globalProto.protos.set(key, root);
        globalProto.contracts.set(key, contract);
        const types = {};
        let pointerTypes = 0;
        for (const namespace of root.nestedArray) {
            for (const type in namespace.toJSON().nested) {
                types[type] = pointerTypes;
                pointerTypes++;
            }
        }
        globalProto.types.set(key, types);
    }
    static retrieve(key) {
        const globalProto = ProtoRegistry.getInstance();
        return globalProto.protos.has(key) ? globalProto.protos.get(key) : null;
    }
    static retrieveIndex(key) {
        const globalProto = ProtoRegistry.getInstance();
        const keys = Array.from(globalProto.index)
            .map((item) => (item[1] === key ? item[0] : null))
            .filter((item) => {
            return item || item === 0;
        });
        return keys.length > 0 ? keys[0] : null;
    }
    static retrieveTypes(key, message) {
        const globalProto = ProtoRegistry.getInstance();
        if (typeof key === 'number') {
            const keys = Array.from(globalProto.index)
                .map((item) => (item[0] === key ? item[1] : null))
                .filter((item) => item);
            key = keys[0];
        }
        const Types = typeof key === 'string' && globalProto.types.has(key)
            ? globalProto.types.get(key)
            : null;
        for (const key in Types) {
            if (Types[key] === message && typeof message === 'number')
                return key;
            else if (key == message && typeof message === 'string')
                return Types[key];
        }
        return null;
    }
    static retrieveByIndex(index) {
        const globalProto = ProtoRegistry.getInstance();
        const contractKey = globalProto.index.has(index)
            ? globalProto.index.get(index)
            : null;
        const proto = contractKey && globalProto.protos.has(contractKey)
            ? globalProto.protos.get(contractKey)
            : null;
        return proto;
    }
    static retrieveContractName(index) {
        const globalProto = ProtoRegistry.getInstance();
        const contractKey = globalProto.index.has(index)
            ? globalProto.index.get(index)
            : null;
        return contractKey;
    }
    static retrieveContract(key) {
        const globalProto = ProtoRegistry.getInstance();
        return globalProto.contracts.has(key)
            ? globalProto.contracts.get(key)
            : null;
    }
    static retrieveAll() {
        const globalProto = ProtoRegistry.getInstance();
        const contractsArr = Array.from(globalProto.contracts);
        const returnObj = {};
        for (const contract of contractsArr)
            returnObj[contract[0].replace('.proto', '')] = contract[1];
        return returnObj;
    }
}
exports.ProtoRegistry = ProtoRegistry;
