"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const path = require("node:path");
const fs = require("node:fs");
const abstracts_1 = require("../abstracts");
const logger_1 = require("./logger");
class Config extends abstracts_1.Singleton {
    constructor() {
        super(...arguments);
        this.config = {};
    }
    static loadConfig() {
        const rootDir = process.cwd();
        const configFiles = ['.cmmv.config', '.cmmv.test'];
        const extensions = ['.js', '.cjs', '.ts'];
        configFiles.forEach(configName => {
            for (const ext of extensions) {
                const filePath = path.join(rootDir, `${configName}${ext}`);
                if (fs.existsSync(filePath)) {
                    let configModule;
                    try {
                        if (ext === '.ts') {
                            require('ts-node').register();
                            configModule = require(filePath);
                        }
                        else {
                            configModule = require(filePath);
                        }
                        if (configName.includes('config')) {
                            const instance = Config.getInstance();
                            instance.config =
                                configModule.default || configModule;
                        }
                        else if (configName.includes('test')) {
                            Config.assign(configModule);
                        }
                        this.logger.log(`Loaded config: ${filePath}`);
                        break;
                    }
                    catch (error) {
                        this.logger.error(`Error loading config from ${filePath}:`, error);
                    }
                }
            }
        });
    }
    static get(key, defaultValue) {
        const config = Config.getInstance();
        const value = key
            .split('.')
            .reduce((o, k) => o && o[k] !== undefined && o[k] !== null ? o[k] : null, config.config);
        return value ? value : defaultValue;
    }
    static has(key) {
        const config = Config.getInstance();
        return (key
            .split('.')
            .reduce((o, k) => (o && k in o ? o[k] : undefined), config.config) !== undefined);
    }
    static set(key, value) {
        const config = Config.getInstance();
        const keys = key.split('.');
        let obj = config.config;
        while (keys.length > 1) {
            const k = keys.shift();
            obj[k] = obj[k] || {};
            obj = obj[k];
        }
        obj[keys[0]] = value;
    }
    static delete(key) {
        const config = Config.getInstance();
        const keys = key.split('.');
        let obj = config.config;
        while (keys.length > 1) {
            const k = keys.shift();
            if (!(k in obj))
                return;
            obj = obj[k];
        }
        delete obj[keys[0]];
    }
    static getAll() {
        return Config.getInstance().config;
    }
    static assign(config) {
        const instance = Config.getInstance();
        instance.config = { ...instance.config, ...config };
    }
    static clear() {
        Config.getInstance().config = {};
    }
    static async validateConfigs(configs) {
        const configInstance = Config.getInstance();
        const loadedConfig = configInstance.config;
        const validateSchema = (schema, config, path = '') => {
            for (const key in schema) {
                const schemaDefinition = schema[key];
                const currentPath = path ? `${path}.${key}` : key;
                const configValue = config[key];
                if (schemaDefinition.required &&
                    (configValue === undefined || configValue === null)) {
                    throw new Error(`Configuration "${currentPath}" is required but missing.`);
                }
                if (configValue === undefined || configValue === null)
                    continue;
                // Handle type validation
                if (schemaDefinition.type !== 'any') {
                    const isTypeValid = (schemaDefinition.type === 'array' &&
                        Array.isArray(configValue)) ||
                        schemaDefinition.type === typeof configValue;
                    if (!isTypeValid) {
                        throw new Error(`Configuration "${currentPath}" expects type "${schemaDefinition.type}" but received "${typeof configValue}".`);
                    }
                }
                // Handle array sub-properties validation
                if (schemaDefinition.type === 'array' &&
                    schemaDefinition.properties &&
                    Array.isArray(configValue)) {
                    configValue.forEach((item, index) => {
                        if (typeof item !== 'object' || item === null) {
                            throw new Error(`Configuration "${currentPath}[${index}]" expects an object but received "${typeof item}".`);
                        }
                        validateSchema(schemaDefinition.properties, item, `${currentPath}[${index}]`);
                    });
                }
                // Handle object sub-properties validation
                if (schemaDefinition.type === 'object' &&
                    schemaDefinition.properties) {
                    if (typeof configValue !== 'object' ||
                        Array.isArray(configValue)) {
                        throw new Error(`Configuration "${currentPath}" expects an object but received "${typeof configValue}".`);
                    }
                    validateSchema(schemaDefinition.properties, configValue, currentPath);
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
}
exports.Config = Config;
Config.logger = new logger_1.Logger('Config');
