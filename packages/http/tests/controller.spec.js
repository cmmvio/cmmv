"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vitest_1 = require("vitest");
const controller_decorator_1 = require("../decorators/controller.decorator");
const controller_registry_1 = require("../registries/controller.registry");
(0, vitest_1.describe)('Controller Decorators', () => {
    (0, vitest_1.beforeEach)(() => {
        controller_registry_1.ControllerRegistry.clear();
    });
    (0, vitest_1.it)('should register a controller with a given prefix', () => {
        let TestController = class TestController {
        };
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)('/test')
        ], TestController);
        const controllers = controller_registry_1.ControllerRegistry.getControllers();
        (0, vitest_1.expect)(controllers.length).toBe(1);
        (0, vitest_1.expect)(controllers[0][1].prefix).toBe('/test');
    });
    (0, vitest_1.it)('should register a controller with an empty prefix by default', () => {
        let TestController = class TestController {
        };
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const controllers = controller_registry_1.ControllerRegistry.getControllers();
        (0, vitest_1.expect)(controllers.length).toBe(1);
        (0, vitest_1.expect)(controllers[0][1].prefix).toBe('');
    });
    (0, vitest_1.it)('should register a GET route', () => {
        let TestController = class TestController {
            getTest() { }
        };
        tslib_1.__decorate([
            (0, controller_decorator_1.Get)('/test-get'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestController.prototype, "getTest", null);
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const routes = controller_registry_1.ControllerRegistry.getRoutes(TestController);
        (0, vitest_1.expect)(routes.length).toBe(1);
        (0, vitest_1.expect)(routes[0].method).toBe('get');
        (0, vitest_1.expect)(routes[0].path).toBe('/test-get');
    });
    (0, vitest_1.it)('should register a POST route', () => {
        let TestController = class TestController {
            postTest() { }
        };
        tslib_1.__decorate([
            (0, controller_decorator_1.Post)('/test-post'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestController.prototype, "postTest", null);
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const routes = controller_registry_1.ControllerRegistry.getRoutes(TestController);
        (0, vitest_1.expect)(routes.length).toBe(1);
        (0, vitest_1.expect)(routes[0].method).toBe('post');
        (0, vitest_1.expect)(routes[0].path).toBe('/test-post');
    });
    (0, vitest_1.it)('should register a PUT route', () => {
        let TestController = class TestController {
            putTest() { }
        };
        tslib_1.__decorate([
            (0, controller_decorator_1.Put)('/test-put'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestController.prototype, "putTest", null);
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const routes = controller_registry_1.ControllerRegistry.getRoutes(TestController);
        (0, vitest_1.expect)(routes.length).toBe(1);
        (0, vitest_1.expect)(routes[0].method).toBe('put');
        (0, vitest_1.expect)(routes[0].path).toBe('/test-put');
    });
    (0, vitest_1.it)('should register a DELETE route', () => {
        let TestController = class TestController {
            deleteTest() { }
        };
        tslib_1.__decorate([
            (0, controller_decorator_1.Delete)('/test-delete'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestController.prototype, "deleteTest", null);
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const routes = controller_registry_1.ControllerRegistry.getRoutes(TestController);
        (0, vitest_1.expect)(routes.length).toBe(1);
        (0, vitest_1.expect)(routes[0].method).toBe('delete');
        (0, vitest_1.expect)(routes[0].path).toBe('/test-delete');
    });
    (0, vitest_1.it)('should register a PATCH route', () => {
        let TestController = class TestController {
            patchTest() { }
        };
        tslib_1.__decorate([
            (0, controller_decorator_1.Patch)('/test-patch'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestController.prototype, "patchTest", null);
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const routes = controller_registry_1.ControllerRegistry.getRoutes(TestController);
        (0, vitest_1.expect)(routes.length).toBe(1);
        (0, vitest_1.expect)(routes[0].method).toBe('patch');
        (0, vitest_1.expect)(routes[0].path).toBe('/test-patch');
    });
    (0, vitest_1.it)('should register a method with a Body parameter', () => {
        let TestController = class TestController {
            test(body) { }
        };
        tslib_1.__decorate([
            tslib_1.__param(0, (0, controller_decorator_1.Body)()),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", [Object]),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestController.prototype, "test", null);
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const params = controller_registry_1.ControllerRegistry.getParams(TestController.prototype, 'test');
        (0, vitest_1.expect)(params.length).toBe(1);
        (0, vitest_1.expect)(params[0].paramType).toBe('body');
    });
    (0, vitest_1.it)('should register a method with a Param parameter', () => {
        let TestController = class TestController {
            test(id) { }
        };
        tslib_1.__decorate([
            tslib_1.__param(0, (0, controller_decorator_1.Param)('id')),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", [String]),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestController.prototype, "test", null);
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const params = controller_registry_1.ControllerRegistry.getParams(TestController.prototype, 'test');
        (0, vitest_1.expect)(params.length).toBe(1);
        (0, vitest_1.expect)(params[0].paramType).toBe('param:id');
        (0, vitest_1.expect)(params[0].paramName).toBe('id');
    });
    (0, vitest_1.it)('should register a method with a Query parameter', () => {
        let TestController = class TestController {
            test(search) { }
        };
        tslib_1.__decorate([
            tslib_1.__param(0, (0, controller_decorator_1.Query)('search')),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", [String]),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestController.prototype, "test", null);
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const params = controller_registry_1.ControllerRegistry.getParams(TestController.prototype, 'test');
        (0, vitest_1.expect)(params.length).toBe(1);
        (0, vitest_1.expect)(params[0].paramType).toBe('query:search');
        (0, vitest_1.expect)(params[0].paramName).toBe('search');
    });
    (0, vitest_1.it)('should register a method with a Header parameter', () => {
        let TestController = class TestController {
            test(auth) { }
        };
        tslib_1.__decorate([
            tslib_1.__param(0, (0, controller_decorator_1.Header)('authorization')),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", [String]),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestController.prototype, "test", null);
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const params = controller_registry_1.ControllerRegistry.getParams(TestController.prototype, 'test');
        (0, vitest_1.expect)(params.length).toBe(1);
        (0, vitest_1.expect)(params[0].paramType).toBe('header:authorization');
        (0, vitest_1.expect)(params[0].paramName).toBe('authorization');
    });
    (0, vitest_1.it)('should register a method with a Request parameter', () => {
        let TestController = class TestController {
            test(req) { }
        };
        tslib_1.__decorate([
            tslib_1.__param(0, (0, controller_decorator_1.Request)()),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", [Object]),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestController.prototype, "test", null);
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const params = controller_registry_1.ControllerRegistry.getParams(TestController.prototype, 'test');
        (0, vitest_1.expect)(params.length).toBe(1);
        (0, vitest_1.expect)(params[0].paramType).toBe('request');
    });
    (0, vitest_1.it)('should register a method with a Response parameter', () => {
        let TestController = class TestController {
            test(res) { }
        };
        tslib_1.__decorate([
            tslib_1.__param(0, (0, controller_decorator_1.Response)()),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", [Object]),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestController.prototype, "test", null);
        TestController = tslib_1.__decorate([
            (0, controller_decorator_1.Controller)()
        ], TestController);
        const params = controller_registry_1.ControllerRegistry.getParams(TestController.prototype, 'test');
        (0, vitest_1.expect)(params.length).toBe(1);
        (0, vitest_1.expect)(params[0].paramType).toBe('response');
    });
});
