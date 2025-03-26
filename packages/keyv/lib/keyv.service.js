"use strict";
var KeyvService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyvService = void 0;
const tslib_1 = require("tslib");
const keyv_1 = require("keyv");
const compress_gzip_1 = require("@keyv/compress-gzip");
const core_1 = require("@cmmv/core");
let KeyvService = KeyvService_1 = class KeyvService extends core_1.Singleton {
    constructor() {
        super(...arguments);
        this.logger = new core_1.Logger('KeyvService');
    }
    static async loadConfig(application) {
        const instance = KeyvService_1.getInstance();
        const config = core_1.Config.get('keyv');
        try {
            instance.manager = new keyv_1.default(config.uri, {
                ...config.options,
                ...{
                    compression: new compress_gzip_1.default(),
                },
            });
        }
        catch (e) {
            instance.logger.error(e.message);
            console.log(e);
        }
    }
    static async set(key, value, ttl = 5) {
        try {
            const instance = KeyvService_1.getInstance();
            await instance.manager.set(key, value, ttl * 1000);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    static async get(key) {
        try {
            const instance = KeyvService_1.getInstance();
            const cachedData = await instance.manager.get(key);
            return cachedData;
        }
        catch (e) {
            return null;
        }
    }
    static async delete(key) {
        try {
            const instance = KeyvService_1.getInstance();
            await instance.manager.delete(key);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    static async clear() {
        try {
            const instance = KeyvService_1.getInstance();
            await instance.manager.clear();
            return true;
        }
        catch (e) {
            return false;
        }
    }
};
exports.KeyvService = KeyvService;
exports.KeyvService = KeyvService = KeyvService_1 = tslib_1.__decorate([
    (0, core_1.Service)()
], KeyvService);
