"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPIRegistry = void 0;
const core_1 = require("@cmmv/core");
class OpenAPIRegistry extends core_1.GenericRegistry {
    static appendMetadataObject(target, key, object) {
        this.controllerMetadata(target, {
            [key]: object,
        });
    }
}
exports.OpenAPIRegistry = OpenAPIRegistry;
