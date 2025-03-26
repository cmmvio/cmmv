"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const generic_registry_1 = require("../../registries/generic.registry");
class TestController {
    async method() { }
}
const controller = new TestController();
(0, vitest_1.describe)('GenericRegistry', () => {
    (0, vitest_1.beforeEach)(() => {
        generic_registry_1.GenericRegistry.clear();
    });
    (0, vitest_1.it)('should register a controller with options', () => {
        generic_registry_1.GenericRegistry.registerController(TestController, { option: 'test' });
        const controllers = generic_registry_1.GenericRegistry.getControllers();
        (0, vitest_1.expect)(controllers.length).toBe(1);
        (0, vitest_1.expect)(controllers[0][0]).toBe(TestController);
        (0, vitest_1.expect)(controllers[0][1].options).toEqual({ option: 'test' });
    });
    (0, vitest_1.it)('should update options if the controller is already registered', () => {
        generic_registry_1.GenericRegistry.registerController(TestController, {
            option: 'initial',
        });
        generic_registry_1.GenericRegistry.registerController(TestController, {
            option: 'updated',
        });
        const controllers = generic_registry_1.GenericRegistry.getControllers();
        (0, vitest_1.expect)(controllers.length).toBe(1);
        (0, vitest_1.expect)(controllers[0][1].options).toEqual({ option: 'updated' });
    });
    (0, vitest_1.it)('should register a handler for a controller', () => {
        generic_registry_1.GenericRegistry.registerHandler(TestController, 'handleEvent');
        const handlers = generic_registry_1.GenericRegistry.getHandlers(TestController);
        (0, vitest_1.expect)(handlers.length).toBe(1);
        (0, vitest_1.expect)(handlers[0].handlerName).toBe('handleEvent');
        (0, vitest_1.expect)(handlers[0].params).toEqual([]);
    });
    (0, vitest_1.it)('should not duplicate handlers with the same name', () => {
        generic_registry_1.GenericRegistry.registerHandler(TestController, 'handleEvent');
        generic_registry_1.GenericRegistry.registerHandler(TestController, 'handleEvent');
        const handlers = generic_registry_1.GenericRegistry.getHandlers(TestController);
        (0, vitest_1.expect)(handlers.length).toBe(1);
    });
    (0, vitest_1.it)('should register parameters for a handler', () => {
        generic_registry_1.GenericRegistry.registerParam(TestController, 'handleEvent', 'string', 0);
        generic_registry_1.GenericRegistry.registerParam(TestController, 'handleEvent', 'number', 1);
        const params = generic_registry_1.GenericRegistry.getParams(TestController, 'handleEvent');
        (0, vitest_1.expect)(params.length).toBe(2);
        (0, vitest_1.expect)(params[0]).toEqual({ paramType: 'string', index: 0 });
        (0, vitest_1.expect)(params[1]).toEqual({ paramType: 'number', index: 1 });
    });
    (0, vitest_1.it)('should return an empty array for handlers of a non-existent controller', () => {
        const handlers = generic_registry_1.GenericRegistry.getHandlers(TestController);
        (0, vitest_1.expect)(handlers).toEqual([]);
    });
    (0, vitest_1.it)('should return an empty array for parameters of a non-existent handler', () => {
        generic_registry_1.GenericRegistry.registerHandler(TestController, 'handleEvent');
        const params = generic_registry_1.GenericRegistry.getParams(TestController, 'nonExistentHandler');
        (0, vitest_1.expect)(params).toEqual([]);
    });
    (0, vitest_1.it)('should clear all registered controllers', () => {
        generic_registry_1.GenericRegistry.registerController(TestController, { option: 'test' });
        generic_registry_1.GenericRegistry.clear();
        const controllers = generic_registry_1.GenericRegistry.getControllers();
        (0, vitest_1.expect)(controllers.length).toBe(0);
    });
});
