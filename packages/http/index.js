"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./decorators/controller.decorator"), exports);
tslib_1.__exportStar(require("./registries/controller.registry"), exports);
tslib_1.__exportStar(require("./adapters/default.adapter"), exports);
tslib_1.__exportStar(require("./transpilers/default.transpiler"), exports);
tslib_1.__exportStar(require("./lib/default.module"), exports);
tslib_1.__exportStar(require("./lib/http.config"), exports);
tslib_1.__exportStar(require("./lib/http.exception"), exports);
tslib_1.__exportStar(require("./lib/http.schema"), exports);
tslib_1.__exportStar(require("./lib/http.utils"), exports);
tslib_1.__exportStar(require("./interfaces/http.interface"), exports);
tslib_1.__exportStar(require("./services/http.service"), exports);
//View
const view_registry_1 = require("./registries/view.registry");
tslib_1.__exportStar(require("./lib/view.renderview"), exports);
tslib_1.__exportStar(require("./lib/view.template"), exports);
tslib_1.__exportStar(require("./lib/view.directives"), exports);
tslib_1.__exportStar(require("./lib/view.eval"), exports);
tslib_1.__exportStar(require("./lib/view.utils"), exports);
tslib_1.__exportStar(require("./lib/view.config"), exports);
tslib_1.__exportStar(require("./transpilers/view.transpile"), exports);
tslib_1.__exportStar(require("./registries/view.registry"), exports);
(async (_) => {
    await view_registry_1.ViewRegistry.load();
})();
