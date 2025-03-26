"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultHTTPModule = void 0;
const core_1 = require("@cmmv/core");
const http_config_1 = require("./http.config");
const view_config_1 = require("./view.config");
const default_transpiler_1 = require("../transpilers/default.transpiler");
const view_transpile_1 = require("../transpilers/view.transpile");
exports.DefaultHTTPModule = new core_1.Module('http', {
    configs: [http_config_1.HTTPConfig, view_config_1.ViewConfig],
    transpilers: [default_transpiler_1.DefaultHTTPTranspiler, view_transpile_1.ViewTranspile],
});
