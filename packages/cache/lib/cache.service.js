"use strict";
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const tslib_1 = require("tslib");
const cacheManager = require("cache-manager");
const fnv1a_1 = require("./fnv1a");
const core_1 = require("@cmmv/core");
let CacheService = CacheService_1 = class CacheService extends core_1.Singleton {
    constructor() {
        super(...arguments);
        this.logger = new core_1.Logger('CacheService');
    }
    static async loadConfig(application) {
        const instance = CacheService_1.getInstance();
        const config = core_1.Config.get('cache');
        try {
            let store = await Promise.resolve(`${config.store}`).then(s => require(s));
            if (config.getter)
                store = store[config.getter];
            instance.manager = await cacheManager.caching(store, {
                ...config,
            });
            core_1.Application.setHTTPInterceptor((id, context) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        const contextCached = core_1.Scope.get(id);
                        if (contextCached) {
                            const metadata = Reflect.getMetadata('cache_metadata', contextCached);
                            if (context.res) {
                                const id = context.req.params?.id
                                    ? context.req.params?.id
                                    : '';
                                let cacheKey = metadata?.key.replace('{id}', id);
                                if (context.req.search)
                                    cacheKey +=
                                        ':' +
                                            context.req.search.replace('?', '');
                                const cacheValue = await CacheService_1.get(cacheKey);
                                if (cacheValue) {
                                    if ((0, core_1.isJSON)(cacheValue)) {
                                        const cacheJSON = {
                                            cache: (0, fnv1a_1.fnv1a)(cacheKey),
                                            ...JSON.parse(cacheValue),
                                        };
                                        delete cacheJSON?.processingTime;
                                        context.res.json(cacheJSON);
                                    }
                                    else
                                        context.res
                                            .status(200)
                                            .send(cacheValue);
                                    resolve(true);
                                }
                            }
                            resolve(false);
                        }
                        else {
                            resolve(false);
                        }
                    }
                    catch (e) {
                        reject(e.message);
                    }
                });
            });
            core_1.Application.setHTTPAfterRender(async (id, context) => {
                try {
                    const contextCached = core_1.Scope.get(id);
                    if (contextCached) {
                        const metadata = Reflect.getMetadata('cache_metadata', contextCached);
                        const stringify = metadata.schema || JSON.stringify;
                        if (context.content && metadata && metadata?.key) {
                            const cacheKey = metadata?.key.replace('{id}', context.req.params.id);
                            const ttl = metadata.options?.ttl || 300;
                            const result = await CacheService_1.set(cacheKey, typeof context.content === 'object'
                                ? stringify(context.content)
                                : context.content, ttl);
                            return result;
                        }
                    }
                }
                catch (e) {
                    return false;
                }
            });
        }
        catch (e) {
            instance.logger.error(e.message);
            console.log(e);
        }
    }
    static async set(key, value, ttl = 5) {
        try {
            const instance = CacheService_1.getInstance();
            await instance.manager.set(key, value, ttl * 1000);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    static async get(key) {
        try {
            const instance = CacheService_1.getInstance();
            const cachedData = await instance.manager.get(key);
            return cachedData;
        }
        catch (e) {
            return null;
        }
    }
    static async del(key) {
        try {
            const instance = CacheService_1.getInstance();
            await instance.manager.del(key);
            return true;
        }
        catch (e) {
            return null;
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = tslib_1.__decorate([
    (0, core_1.Service)()
], CacheService);
