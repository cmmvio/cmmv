import 'dotenv/config';
import * as path from 'node:path';
import * as fs from 'node:fs';

import { Singleton } from '../abstracts';

import { ConfigSchema, ConfigSubPropsSchemas } from '../interfaces';

import { Module } from './module';

import { Logger } from './logger';
import { Application } from '..';

export class Config extends Singleton {
    private config: Record<string, any> = {};
    private static readonly logger = new Logger('Config');

    public static loadConfig(): void {
        const rootDir = process.cwd();
        const configFiles = [
            '.cmmv.config',
            '.cmmv.test',
            'config',
            'config.test',
        ];
        const extensions = ['.js', '.cjs', '.ts'];

        configFiles.forEach(async (configName) => {
            for (const ext of extensions) {
                const filePath = path.join(rootDir, `${configName}${ext}`);

                if (fs.existsSync(filePath)) {
                    let configModule;

                    try {
                        if (ext === '.ts')
                            configModule = await import(filePath);
                        else configModule = require(filePath);

                        if (configName.includes('config')) {
                            const instance = Config.getInstance();
                            instance.config =
                                configModule.default || configModule;
                        } else if (configName.includes('test')) {
                            Config.assign(configModule);
                        }

                        this.logger.log(`Loaded config: ${filePath}`);
                        break;
                    } catch (error) {
                        this.logger.error(
                            `Error loading config from ${filePath}:`,
                            error,
                        );
                    }
                }
            }
        });
    }

    public static get<T = any>(
        key: string,
        defaultValue?: any,
    ): T | null | any {
        const config = Config.getInstance();
        const value = key
            .split('.')
            .reduce(
                (o, k) =>
                    o && o[k] !== undefined && o[k] !== null ? o[k] : null,
                config.config,
            ) as T;
        return value ? value : defaultValue;
    }

    public static has(key: string): boolean {
        const config = Config.getInstance();
        return (
            key
                .split('.')
                .reduce(
                    (o, k) => (o && k in o ? o[k] : undefined),
                    config.config,
                ) !== undefined
        );
    }

    public static set(key: string, value: any): void {
        const config = Config.getInstance();
        const keys = key.split('.');
        let obj = config.config;

        while (keys.length > 1) {
            const k = keys.shift()!;
            obj[k] = obj[k] || {};
            obj = obj[k];
        }

        obj[keys[0]] = value;
    }

    public static delete(key: string): void {
        const config = Config.getInstance();
        const keys = key.split('.');
        let obj = config.config;

        while (keys.length > 1) {
            const k = keys.shift()!;
            if (!(k in obj)) return;
            obj = obj[k];
        }

        delete obj[keys[0]];
    }

    public static getAll(): Record<string, any> {
        return Config.getInstance().config;
    }

    public static assign(config: Record<string, any>): void {
        const instance = Config.getInstance();
        instance.config = { ...instance.config, ...config };
    }

    public static clear(): void {
        Config.getInstance().config = {};
    }

    public static async validateConfigs(
        configs: Array<ConfigSchema>,
    ): Promise<void> {
        const configInstance = Config.getInstance();
        const loadedConfig = configInstance.config;

        const validateSchema = (
            schema: ConfigSubPropsSchemas,
            config: Record<string, any>,
            path: string = '',
        ) => {
            for (const key in schema) {
                const schemaDefinition = schema[key];
                const currentPath = path ? `${path}.${key}` : key;
                const configValue = config[key];

                if (
                    schemaDefinition.required &&
                    (configValue === undefined || configValue === null)
                ) {
                    throw new Error(
                        `Configuration "${currentPath}" is required but missing.`,
                    );
                }

                if (configValue === undefined || configValue === null) continue;

                // Handle type validation
                if (schemaDefinition.type !== 'any') {
                    const isTypeValid =
                        (schemaDefinition.type === 'array' &&
                            Array.isArray(configValue)) ||
                        schemaDefinition.type === typeof configValue;

                    if (!isTypeValid) {
                        throw new Error(
                            `Configuration "${currentPath}" expects type "${schemaDefinition.type}" but received "${typeof configValue}".`,
                        );
                    }
                }

                // Handle array sub-properties validation
                if (
                    schemaDefinition.type === 'array' &&
                    schemaDefinition.properties &&
                    Array.isArray(configValue)
                ) {
                    configValue.forEach((item, index) => {
                        if (typeof item !== 'object' || item === null) {
                            throw new Error(
                                `Configuration "${currentPath}[${index}]" expects an object but received "${typeof item}".`,
                            );
                        }

                        validateSchema(
                            schemaDefinition.properties,
                            item,
                            `${currentPath}[${index}]`,
                        );
                    });
                }

                // Handle object sub-properties validation
                if (
                    schemaDefinition.type === 'object' &&
                    schemaDefinition.properties
                ) {
                    if (
                        typeof configValue !== 'object' ||
                        Array.isArray(configValue)
                    ) {
                        throw new Error(
                            `Configuration "${currentPath}" expects an object but received "${typeof configValue}".`,
                        );
                    }

                    validateSchema(
                        schemaDefinition.properties,
                        configValue,
                        currentPath,
                    );
                }
            }
        };

        for (const schema of configs) {
            for (const moduleKey in schema) {
                const moduleSchema = schema[moduleKey];
                const moduleConfig = loadedConfig[moduleKey];

                if (moduleConfig !== undefined && moduleConfig !== null)
                    validateSchema(moduleSchema, moduleConfig, moduleKey);
            }
        }
    }

    public static envMap(envConfig: Record<string, any>): void {
        const instance = Config.getInstance();

        for (const key in envConfig) {
            if (envConfig[key] === undefined)
                instance.config[envConfig[key]] = process.env[key];
        }
    }
}
