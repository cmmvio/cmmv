import { AbstractService } from '@cmmv/core';
import { IInsertResponse } from '@cmmv/repository';
export declare class VaultService extends AbstractService {
    createKeys(): Promise<{
        namespace: any;
        privateKey: any;
        publicKey: any;
    }>;
    insert(key: string, payload: string | object): Promise<IInsertResponse | null>;
    get(key: string): Promise<string | object | null>;
    remove(key: string): Promise<object>;
}
