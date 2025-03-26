"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyvModule = void 0;
const core_1 = require("@cmmv/core");
const keyv_config_1 = require("./keyv.config");
const keyv_service_1 = require("./keyv.service");
exports.KeyvModule = new core_1.Module('keyv', {
    configs: [keyv_config_1.KeyvConfig],
    providers: [keyv_service_1.KeyvService],
});
