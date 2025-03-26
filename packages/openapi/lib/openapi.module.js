"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPIModule = void 0;
const core_1 = require("@cmmv/core");
const openapi_config_1 = require("./openapi.config");
const openapi_service_1 = require("./openapi.service");
const openapi_controller_1 = require("./openapi.controller");
exports.OpenAPIModule = new core_1.Module('openapi', {
    configs: [openapi_config_1.OpenAPIConfig],
    providers: [openapi_service_1.OpenAPIService],
    controllers: [openapi_controller_1.OpenAPIController],
});
