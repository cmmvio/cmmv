import { AbstractContract } from '@cmmv/core';
export declare class LogsContract extends AbstractContract {
    message: string;
    host: string;
    timestamp: number;
    source: string;
    level: string;
    file: string;
    event: string;
    metadata: string;
}
