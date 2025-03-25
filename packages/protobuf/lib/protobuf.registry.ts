import * as path from 'node:path';
import * as fs from 'node:fs';
import * as protobuf from 'protobufjs';
import * as fg from 'fast-glob';

import { Singleton } from '@cmmv/core';

interface Types {
    [key: string]: any;
}

export class ProtoRegistry extends Singleton {
    public protos: Map<string, protobuf.Root> = new Map<
        string,
        protobuf.Root
    >();
    public index: Map<number, string> = new Map<number, string>();
    public contracts: Map<string, string> = new Map<string, string>();
    public types: Map<string, Types> = new Map<string, Types>();

    static async load() {
        const directoryPackages = path.resolve(
            process.env.NODE_ENV === 'prod'
                ? './node_modules/@cmmv/**/*.proto'
                : './packages/**/*.proto',
        );

        const directory = path.resolve(
            process.env.NODE_ENV === 'prod'
                ? './dist/**/*.proto'
                : './src/**/*.proto',
        );

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

    static register(key: string, root: protobuf.Root, contract: string): void {
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

    static retrieve(key: string): protobuf.Root | null {
        const globalProto = ProtoRegistry.getInstance();
        return globalProto.protos.has(key) ? globalProto.protos.get(key) : null;
    }

    static retrieveIndex(key: string): number | null {
        const globalProto = ProtoRegistry.getInstance();

        const keys = Array.from(globalProto.index)
            .map((item) => (item[1] === key ? item[0] : null))
            .filter((item) => {
                return item || item === 0;
            });

        return keys.length > 0 ? keys[0] : null;
    }

    static retrieveTypes(
        key: string | number,
        message: string | number,
    ): string | null {
        const globalProto = ProtoRegistry.getInstance();

        if (typeof key === 'number') {
            const keys = Array.from(globalProto.index)
                .map((item) => (item[0] === key ? item[1] : null))
                .filter((item) => item);

            key = keys[0];
        }

        const Types =
            typeof key === 'string' && globalProto.types.has(key)
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

    static retrieveByIndex(index: number): protobuf.Root | null {
        const globalProto = ProtoRegistry.getInstance();
        const contractKey = globalProto.index.has(index)
            ? globalProto.index.get(index)
            : null;
        const proto =
            contractKey && globalProto.protos.has(contractKey)
                ? globalProto.protos.get(contractKey)
                : null;
        return proto;
    }

    static retrieveContractName(index: number): string {
        const globalProto = ProtoRegistry.getInstance();
        const contractKey = globalProto.index.has(index)
            ? globalProto.index.get(index)
            : null;
        return contractKey;
    }

    static retrieveContract(key: string): string | null {
        const globalProto = ProtoRegistry.getInstance();
        return globalProto.contracts.has(key)
            ? globalProto.contracts.get(key)
            : null;
    }

    static retrieveAll(): object {
        const globalProto = ProtoRegistry.getInstance();
        const contractsArr = Array.from(globalProto.contracts);
        const returnObj = {};

        for (const contract of contractsArr)
            returnObj[contract[0].replace('.proto', '')] = contract[1];

        return returnObj;
    }
}
