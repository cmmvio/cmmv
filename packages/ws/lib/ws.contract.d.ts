import { AbstractContract } from '@cmmv/core';
export declare class WSContract extends AbstractContract {
    contract: number;
    message: number;
    data: Uint8Array;
}
export declare class WSError extends AbstractContract {
    message: string;
    code?: number;
    context?: string;
}
