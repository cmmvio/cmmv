import Keyv from 'keyv';
import KeyvGzip from '@keyv/compress-gzip';

import { Application, Config, Logger, Service, Singleton } from '@cmmv/core';

@Service()
export class KeyvService extends Singleton {
    public logger: Logger = new Logger('KeyvService');
    public manager: Keyv<any>;

    public static async loadConfig(application: Application): Promise<void> {
        const instance = KeyvService.getInstance();
        const config = Config.get('keyv');

        try {
            instance.manager = new Keyv(config.uri, {
                ...config.options,
                ...{
                    compression: new KeyvGzip(),
                },
            });
        } catch (e) {
            instance.logger.error(e.message);
            console.log(e);
        }
    }

    public static async set(
        key: string,
        value: string,
        ttl: number = 5,
    ): Promise<boolean> {
        try {
            const instance = KeyvService.getInstance();
            await instance.manager.set(key, value, ttl * 1000);
            return true;
        } catch (e) {
            return false;
        }
    }

    public static async get(key: string): Promise<any> {
        try {
            const instance = KeyvService.getInstance();
            const cachedData = await instance.manager.get(key);
            return cachedData;
        } catch (e) {
            return null;
        }
    }

    public static async delete(key: string): Promise<boolean> {
        try {
            const instance = KeyvService.getInstance();
            await instance.manager.delete(key);
            return true;
        } catch (e) {
            return false;
        }
    }

    public static async clear(): Promise<boolean> {
        try {
            const instance = KeyvService.getInstance();
            await instance.manager.clear();
            return true;
        } catch (e) {
            return false;
        }
    }
}
