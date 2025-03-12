import { describe, it, expect, beforeEach } from 'vitest';
import { ControllerRegistry } from '../registries/controller.registry';

class TestController {
    testMethod() {}
}

describe('ControllerRegistry', function () {
    beforeEach(function () {
        ControllerRegistry.clear();
    });

    it('should register a controller with the given prefix', function () {
        ControllerRegistry.registerController(TestController, '/test');
        const controllers = ControllerRegistry.getControllers();

        expect(controllers.length).toBe(1);
        expect(controllers[0][1].prefix).toBe('/test');
    });

    it('should register a route for the controller', function () {
        ControllerRegistry.registerController(TestController, '/test');
        ControllerRegistry.registerRoute(
            TestController.prototype,
            'get',
            '/path',
            'testMethod',
        );

        const routes = ControllerRegistry.getRoutes(TestController);

        expect(routes.length).toBe(1);
        expect(routes[0].method).toBe('get');
        expect(routes[0].path).toBe('/path');
        expect(routes[0].handlerName).toBe('testMethod');
    });

    it('should update the method and path if the route already exists', function () {
        ControllerRegistry.registerController(TestController, '/test');
        ControllerRegistry.registerRoute(
            TestController.prototype,
            'get',
            '/path',
            'testMethod',
        );
        ControllerRegistry.registerRoute(
            TestController.prototype,
            'post',
            '/newpath',
            'testMethod',
        );

        const routes = ControllerRegistry.getRoutes(TestController);

        expect(routes.length).toBe(1);
        expect(routes[0].method).toBe('post');
        expect(routes[0].path).toBe('/newpath');
    });

    it('should register a parameter for a route handler', function () {
        ControllerRegistry.registerController(TestController, '/test');
        ControllerRegistry.registerRoute(
            TestController.prototype,
            'get',
            '/path',
            'testMethod',
        );
        ControllerRegistry.registerParam(
            TestController.prototype,
            'testMethod',
            'param',
            0,
            'id',
        );

        const params = ControllerRegistry.getParams(
            TestController.prototype,
            'testMethod',
        );

        expect(params.length).toBe(1);
        expect(params[0].paramType).toBe('param');
        expect(params[0].index).toBe(0);
        expect(params[0].paramName).toBe('id');
    });

    it('should return an empty array if no routes are registered for a controller', function () {
        const routes = ControllerRegistry.getRoutes(TestController);
        expect(routes.length).toBe(0);
    });

    it('should return an empty array if no params are registered for a route handler', function () {
        const params = ControllerRegistry.getParams(
            TestController.prototype,
            'nonExistentMethod',
        );
        expect(params.length).toBe(0);
    });

    it('should clear all registered controllers and routes', function () {
        ControllerRegistry.registerController(TestController, '/test');
        ControllerRegistry.registerRoute(
            TestController.prototype,
            'get',
            '/path',
            'testMethod',
        );

        ControllerRegistry.clear();
        const controllers = ControllerRegistry.getControllers();

        expect(controllers.length).toBe(0);
    });
});
