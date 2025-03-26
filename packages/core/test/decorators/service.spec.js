"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("reflect-metadata");
const vitest_1 = require("vitest");
const service_registry_1 = require("../../registries/service.registry");
const service_decorator_1 = require("../../decorators/service.decorator");
(0, vitest_1.describe)('Service Decorator', () => {
    (0, vitest_1.beforeEach)(() => {
        service_registry_1.ServiceRegistry.clear();
    });
    (0, vitest_1.it)('should register a service with a given name', () => {
        let MyService = class MyService {
        };
        MyService = tslib_1.__decorate([
            (0, service_decorator_1.Service)('MyService')
        ], MyService);
        const service = service_registry_1.ServiceRegistry.getService('MyService');
        (0, vitest_1.expect)(service).toBe(MyService);
    });
    (0, vitest_1.it)('should register a service with a default name when none is provided', () => {
        let MyDefaultService = class MyDefaultService {
        };
        MyDefaultService = tslib_1.__decorate([
            (0, service_decorator_1.Service)()
        ], MyDefaultService);
        const serviceName = Reflect.getMetadata('service_name', MyDefaultService);
        (0, vitest_1.expect)(serviceName).toBe('');
        const service = service_registry_1.ServiceRegistry.getService('');
        (0, vitest_1.expect)(service).toBe(MyDefaultService);
    });
    (0, vitest_1.it)('should return undefined for unregistered service', () => {
        const service = service_registry_1.ServiceRegistry.getService('NonExistentService');
        (0, vitest_1.expect)(service).toBeUndefined();
    });
    (0, vitest_1.it)('should handle multiple services with different names', () => {
        let ServiceOne = class ServiceOne {
        };
        ServiceOne = tslib_1.__decorate([
            (0, service_decorator_1.Service)('ServiceOne')
        ], ServiceOne);
        let ServiceTwo = class ServiceTwo {
        };
        ServiceTwo = tslib_1.__decorate([
            (0, service_decorator_1.Service)('ServiceTwo')
        ], ServiceTwo);
        const serviceOne = service_registry_1.ServiceRegistry.getService('ServiceOne');
        const serviceTwo = service_registry_1.ServiceRegistry.getService('ServiceTwo');
        (0, vitest_1.expect)(serviceOne).toBe(ServiceOne);
        (0, vitest_1.expect)(serviceTwo).toBe(ServiceTwo);
    });
    (0, vitest_1.afterEach)(() => {
        service_registry_1.ServiceRegistry.clear();
    });
});
