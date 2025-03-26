import Keyv from 'keyv';
import { Application, Logger, Singleton } from '@cmmv/core';
export declare class KeyvService extends Singleton {
    logger: Logger;
    manager: Keyv<any>;
    static loadConfig(application: Application): Promise<void>;
    static set(key: string, value: string, ttl?: number): Promise<boolean>;
    static get(key: string): Promise<any>;
    static delete(key: string): Promise<boolean>;
    static clear(): Promise<boolean>;
}
