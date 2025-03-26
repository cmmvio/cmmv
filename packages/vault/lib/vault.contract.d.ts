import { AbstractContract } from '@cmmv/core';
export declare class VaultContract extends AbstractContract {
    key: string;
    payload: string;
    iv: string;
    tag: string;
    ephemeral: string;
}
