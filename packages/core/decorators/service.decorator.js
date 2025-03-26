"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = Service;
const service_registry_1 = require("../registries/service.registry");
function Service(name = '') {
    return (target) => {
        Reflect.defineMetadata('service_name', name, target);
        service_registry_1.ServiceRegistry.registerService(target, name);
    };
}
