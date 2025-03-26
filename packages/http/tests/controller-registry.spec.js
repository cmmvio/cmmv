"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const controller_registry_1 = require("../registries/controller.registry");
class TestController {
    testMethod() { }
}
(0, vitest_1.describe)('ControllerRegistry', function () {
    (0, vitest_1.beforeEach)(function () {
        controller_registry_1.ControllerRegistry.clear();
    });
    (0, vitest_1.it)('should register a controller with the given prefix', function () {
        controller_registry_1.ControllerRegistry.registerController(TestController, '/test');
        const controllers = controller_registry_1.ControllerRegistry.getControllers();
        (0, vitest_1.expect)(controllers.length).toBe(1);
        (0, vitest_1.expect)(controllers[0][1].prefix).toBe('/test');
    });
    (0, vitest_1.it)('should register a route for the controller', function () {
        controller_registry_1.ControllerRegistry.registerController(TestController, '/test');
        controller_registry_1.ControllerRegistry.registerRoute(TestController.prototype, 'get', '/path', 'testMethod');
        const routes = controller_registry_1.ControllerRegistry.getRoutes(TestController);
        (0, vitest_1.expect)(routes.length).toBe(1);
        (0, vitest_1.expect)(routes[0].method).toBe('get');
        (0, vitest_1.expect)(routes[0].path).toBe('/path');
        (0, vitest_1.expect)(routes[0].handlerName).toBe('testMethod');
    });
    (0, vitest_1.it)('should update the method and path if the route already exists', function () {
        controller_registry_1.ControllerRegistry.registerController(TestController, '/test');
        controller_registry_1.ControllerRegistry.registerRoute(TestController.prototype, 'get', '/path', 'testMethod');
        controller_registry_1.ControllerRegistry.registerRoute(TestController.prototype, 'post', '/newpath', 'testMethod');
        const routes = controller_registry_1.ControllerRegistry.getRoutes(TestController);
        (0, vitest_1.expect)(routes.length).toBe(1);
        (0, vitest_1.expect)(routes[0].method).toBe('post');
        (0, vitest_1.expect)(routes[0].path).toBe('/newpath');
    });
    (0, vitest_1.it)('should register a parameter for a route handler', function () {
        controller_registry_1.ControllerRegistry.registerController(TestController, '/test');
        controller_registry_1.ControllerRegistry.registerRoute(TestController.prototype, 'get', '/path', 'testMethod');
        controller_registry_1.ControllerRegistry.registerParam(TestController.prototype, 'testMethod', 'param', 0, 'id');
        const params = controller_registry_1.ControllerRegistry.getParams(TestController.prototype, 'testMethod');
        (0, vitest_1.expect)(params.length).toBe(1);
        (0, vitest_1.expect)(params[0].paramType).toBe('param');
        (0, vitest_1.expect)(params[0].index).toBe(0);
        (0, vitest_1.expect)(params[0].paramName).toBe('id');
    });
    (0, vitest_1.it)('should return an empty array if no routes are registered for a controller', function () {
        const routes = controller_registry_1.ControllerRegistry.getRoutes(TestController);
        (0, vitest_1.expect)(routes.length).toBe(0);
    });
    (0, vitest_1.it)('should return an empty array if no params are registered for a route handler', function () {
        const params = controller_registry_1.ControllerRegistry.getParams(TestController.prototype, 'nonExistentMethod');
        (0, vitest_1.expect)(params.length).toBe(0);
    });
    (0, vitest_1.it)('should clear all registered controllers and routes', function () {
        controller_registry_1.ControllerRegistry.registerController(TestController, '/test');
        controller_registry_1.ControllerRegistry.registerRoute(TestController.prototype, 'get', '/path', 'testMethod');
        controller_registry_1.ControllerRegistry.clear();
        const controllers = controller_registry_1.ControllerRegistry.getControllers();
        (0, vitest_1.expect)(controllers.length).toBe(0);
    });
});
