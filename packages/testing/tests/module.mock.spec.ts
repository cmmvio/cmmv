import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockModule, mockModule } from '../lib/module.mock';

describe('MockModule', () => {
    beforeEach(() => {
        MockModule.reset();
    });

    it('should create a module with default options', () => {
        const module = new MockModule('TestModule');

        expect(module.devMode).toBe(false);
        expect(module.controllers).toEqual([]);
        expect(module.providers).toEqual([]);
        expect(module.transpilers).toEqual([]);
        expect(module.submodules).toEqual([]);
        expect(module.contracts).toEqual([]);
        expect(module.contractsCls).toEqual([]);
        expect(module.configs).toEqual([]);
        expect(module.entities).toEqual([]);
        expect(module.models).toEqual([]);
        expect(module.resolvers).toEqual([]);

        expect(MockModule.modules.get('TestModule')).toBe(module);
    });

    it('should create a module with custom options', () => {
        const controllers = [{ route: '/test' }];
        const providers = [{ provide: 'TEST' }];
        const transpilers = [class TestTranspiler {}];
        const submodules = [{ name: 'SubModule' }];
        const contracts = [class TestContract {}];
        const configs = [{ key: 'value' }];
        const entities = [class TestEntity {}];
        const models = [class TestModel {}];
        const resolvers = [class TestResolver {}];

        const module = new MockModule('CustomModule', {
            devMode: true,
            controllers,
            providers,
            transpilers,
            submodules,
            contracts,
            configs,
            entities,
            models,
            resolvers,
        });

        expect(module.devMode).toBe(true);
        expect(module.controllers).toEqual(controllers);
        expect(module.providers).toEqual(providers);
        expect(module.transpilers).toEqual(transpilers);
        expect(module.submodules).toEqual(submodules);
        expect(module.contractsCls).toEqual(contracts);
        expect(module.contracts.length).toBe(1);
        expect(module.contracts[0] instanceof contracts[0]).toBe(true);
        expect(module.configs).toEqual(configs);
        expect(module.entities).toEqual(entities);
        expect(module.models).toEqual(models);
        expect(module.resolvers).toEqual(resolvers);

        expect(MockModule.modules.get('CustomModule')).toBe(module);
    });

    it('should check if module exists', () => {
        new MockModule('ExistingModule');

        expect(MockModule.hasModule('ExistingModule')).toBe(true);
        expect(MockModule.hasModule('NonExistingModule')).toBe(false);
        expect(MockModule.hasModule).toHaveBeenCalledWith('ExistingModule');
        expect(MockModule.hasModule).toHaveBeenCalledWith('NonExistingModule');
    });

    it('should get module by name', () => {
        const existingModule = new MockModule('ExistingModule');

        expect(MockModule.getModule('ExistingModule')).toBe(existingModule);
        expect(MockModule.getModule('NonExistingModule')).toBeNull();
        expect(MockModule.getModule).toHaveBeenCalledWith('ExistingModule');
        expect(MockModule.getModule).toHaveBeenCalledWith('NonExistingModule');
    });

    it('should load transpile', () => {
        class TestTranspile {
            run() {
                return 'test';
            }
        }

        const result = MockModule.loadTranspile(TestTranspile);
        expect(result).toBeInstanceOf(TestTranspile);
        expect(MockModule.loadTranspile).toHaveBeenCalledWith(TestTranspile);

        // Teste com objeto que não pode ser instanciado
        const rawObject = { notAClass: true };
        const result2 = MockModule.loadTranspile(rawObject);
        expect(result2).toEqual({});
    });

    it('should get controllers', () => {
        const controllers = [{ route: '/test' }];
        const module = new MockModule('TestModule', { controllers });

        expect(module.getControllers()).toEqual(controllers);
        expect(module.getControllers).toHaveBeenCalled();
    });

    it('should get transpilers', () => {
        const transpilers = [class TestTranspiler {}];
        const module = new MockModule('TestModule', { transpilers });

        expect(module.getTranspilers()).toEqual(transpilers);
        expect(module.getTranspilers).toHaveBeenCalled();
    });

    it('should get submodules', () => {
        const submodules = [{ name: 'SubModule' }];
        const module = new MockModule('TestModule', { submodules });

        expect(module.getSubmodules()).toEqual(submodules);
        expect(module.getSubmodules).toHaveBeenCalled();
    });

    it('should get contracts', () => {
        class TestContract {}
        const contracts = [TestContract];
        const module = new MockModule('TestModule', { contracts });

        expect(module.getContracts()[0]).toBeInstanceOf(TestContract);
        expect(module.getContracts).toHaveBeenCalled();
    });

    it('should get contract classes', () => {
        class TestContract {}
        const contracts = [TestContract];
        const module = new MockModule('TestModule', { contracts });

        expect(module.getContractsCls()).toEqual(contracts);
        expect(module.getContractsCls).toHaveBeenCalled();
    });

    it('should get providers', () => {
        const providers = [{ provide: 'TEST' }];
        const module = new MockModule('TestModule', { providers });

        expect(module.getProviders()).toEqual(providers);
        expect(module.getProviders).toHaveBeenCalled();
    });

    it('should get config schemas', () => {
        const configs = [{ key: 'value' }];
        const module = new MockModule('TestModule', { configs });

        expect(module.getConfigsSchemas()).toEqual(configs);
        expect(module.getConfigsSchemas).toHaveBeenCalled();
    });

    it('should get entities', () => {
        const entities = [class TestEntity {}];
        const module = new MockModule('TestModule', { entities });

        expect(module.getEntities()).toEqual(entities);
        expect(module.getEntities).toHaveBeenCalled();
    });

    it('should get models', () => {
        const models = [class TestModel {}];
        const module = new MockModule('TestModule', { models });

        expect(module.getModels()).toEqual(models);
        expect(module.getModels).toHaveBeenCalled();
    });

    it('should get resolvers', () => {
        const resolvers = [class TestResolver {}];
        const module = new MockModule('TestModule', { resolvers });

        expect(module.getResolvers()).toEqual(resolvers);
        expect(module.getResolvers).toHaveBeenCalled();
    });

    it('should reset static members', () => {
        new MockModule('TestModule1');
        new MockModule('TestModule2');

        expect(MockModule.modules.size).toBe(2);
        expect(MockModule.hasModule('TestModule1')).toBe(true);

        // Guardar contadores de chamadas
        const hasModuleCallCount = MockModule.hasModule.mock.calls.length;
        const getModuleCallCount = MockModule.getModule.mock.calls.length;

        // Reset
        MockModule.reset();

        // Verificar que dados foram limpos
        expect(MockModule.modules.size).toBe(0);
        expect(MockModule.hasModule('TestModule1')).toBe(false);

        // Verificar que contadores foram resetados
        expect(MockModule.hasModule.mock.calls.length).toBe(1); // Chamada acima
        expect(MockModule.getModule.mock.calls.length).toBe(0);
    });

    it('should reset instance members', () => {
        const module = new MockModule('TestModule');

        // Chamar alguns métodos para verificar depois
        module.getControllers();
        module.getProviders();

        // Guardar contadores de chamadas
        const getControllersCallCount = module.getControllers.mock.calls.length;
        const getProvidersCallCount = module.getProviders.mock.calls.length;

        // Reset
        module.reset();

        // Verificar que os contadores foram resetados
        expect(module.getControllers.mock.calls.length).toBe(0);
        expect(module.getProviders.mock.calls.length).toBe(0);
    });

    it('should provide mock module structure', () => {
        const mockModule = MockModule.getMockModule();
        expect(mockModule).toHaveProperty('Module', MockModule);
    });

    it('should expose mockModule as an alias', () => {
        expect(mockModule).toBe(MockModule);
    });
});
