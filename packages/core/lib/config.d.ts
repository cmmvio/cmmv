import { Singleton } from '../abstracts';
import { ConfigSchema } from '../interfaces';
export declare class Config extends Singleton {
    private config;
    private static readonly logger;
    static loadConfig(): void;
    static get<T = any>(key: string, defaultValue?: any): T | null | any;
    static has(key: string): boolean;
    static set(key: string, value: any): void;
    static delete(key: string): void;
    static getAll(): Record<string, any>;
    static assign(config: Record<string, any>): void;
    static clear(): void;
    static validateConfigs(configs: Array<ConfigSchema>): Promise<void>;
}
