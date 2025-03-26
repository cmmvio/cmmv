"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = void 0;
class ServiceRegistry {
    static registerService(target, name) {
        this.services.set(target, { name });
    }
    static getServices() {
        return Array.from(this.services.entries());
    }
    static getServicesArr() {
        return Array.from(this.services.entries()).reduce((acc, [cls, instance]) => {
            acc[instance.name] = new cls();
            return acc;
        }, {});
    }
    static getService(name) {
        for (const [target, metadata] of this.services.entries()) {
            if (metadata.name === name)
                return target;
        }
        return undefined;
    }
    static clear() {
        this.services.clear();
    }
}
exports.ServiceRegistry = ServiceRegistry;
ServiceRegistry.services = new Map();
