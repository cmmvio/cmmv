import { AbstractService } from '@cmmv/core';
import { IThrottler } from './throttler.interface';
export declare class ThrottlerService extends AbstractService {
    static _storage: Map<string, IThrottler>;
    static _gcInterval: number;
    static _gcIntervalId: NodeJS.Timeout;
    static loadConfig(): Promise<void>;
    interceptor(path: string, { req, res, next, handler, }: {
        req: any;
        res: any;
        next: any;
        handler: any;
    }): Promise<boolean>;
    static validateRequest(requestSignature: string, handlerName: string, ip: string): boolean;
    static getThrottler(requestSignature: string): IThrottler;
    static setThrottler(requestSignature: string, throttler: IThrottler): void;
    static deleteThrottler(path: string): void;
    static gc(): void;
    static clearThrottler(): void;
}
