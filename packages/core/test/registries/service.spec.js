"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const service_registry_1 = require("../../registries/service.registry");
class TestService {
}
(0, vitest_1.describe)('ServiceRegistry', () => {
    (0, vitest_1.beforeEach)(() => {
        service_registry_1.ServiceRegistry.clear();
    });
    (0, vitest_1.it)('should register a service with the given name', () => {
        service_registry_1.ServiceRegistry.registerService(TestService, 'TestService');
        const services = service_registry_1.ServiceRegistry.getServices();
        (0, vitest_1.expect)(services.length).toBe(1);
        (0, vitest_1.expect)(services[0][1].name).toBe('TestService');
    });
    (0, vitest_1.it)('should return the correct service by name', () => {
        service_registry_1.ServiceRegistry.registerService(TestService, 'TestService');
        const service = service_registry_1.ServiceRegistry.getService('TestService');
        (0, vitest_1.expect)(service).toBe(TestService);
    });
    (0, vitest_1.it)('should return undefined for a non-existent service', () => {
        const service = service_registry_1.ServiceRegistry.getService('NonExistentService');
        (0, vitest_1.expect)(service).toBeUndefined();
    });
    (0, vitest_1.it)('should return all registered services', () => {
        class AnotherService {
        }
        service_registry_1.ServiceRegistry.registerService(TestService, 'TestService');
        service_registry_1.ServiceRegistry.registerService(AnotherService, 'AnotherService');
        const services = service_registry_1.ServiceRegistry.getServices();
        (0, vitest_1.expect)(services.length).toBe(2);
        (0, vitest_1.expect)(services[0][1].name).toBe('TestService');
        (0, vitest_1.expect)(services[1][1].name).toBe('AnotherService');
    });
    (0, vitest_1.it)('should clear all registered services', () => {
        service_registry_1.ServiceRegistry.registerService(TestService, 'TestService');
        service_registry_1.ServiceRegistry.clear();
        const services = service_registry_1.ServiceRegistry.getServices();
        (0, vitest_1.expect)(services.length).toBe(0);
    });
});
