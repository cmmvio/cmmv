import * as cacheManager from 'cache-manager';
import { Application, Logger, Singleton } from '@cmmv/core';
export declare class CacheService extends Singleton {
    logger: Logger;
    manager: cacheManager.Cache<any> | cacheManager.MemoryCache;
    static loadConfig(application: Application): Promise<void>;
    static set(key: string, value: string, ttl?: number): Promise<boolean>;
    static get(key: string): Promise<any>;
    static del(key: string): Promise<boolean>;
}
