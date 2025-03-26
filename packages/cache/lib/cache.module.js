"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheModule = void 0;
const core_1 = require("@cmmv/core");
const cache_config_1 = require("./cache.config");
const cache_service_1 = require("./cache.service");
exports.CacheModule = new core_1.Module('cache', {
    configs: [cache_config_1.CacheConfig],
    providers: [cache_service_1.CacheService],
});
