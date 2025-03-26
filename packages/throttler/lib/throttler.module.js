"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThrottlerModule = void 0;
const core_1 = require("@cmmv/core");
const throttler_config_1 = require("./throttler.config");
const throttler_service_1 = require("./throttler.service");
exports.ThrottlerModule = new core_1.Module('throttler', {
    configs: [throttler_config_1.ThrottlerConfig],
    providers: [throttler_service_1.ThrottlerService],
});
