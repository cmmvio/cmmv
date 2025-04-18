import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    MockCore,
    mockCore,
    MockConfig,
    mockConfig,
    MockCompile,
    mockCompile,
    MockHooks,
    mockHooks,
    MockHooksType,
    MockLogger,
    mockLogger,
    MockModule,
    mockModule,
    MockResolvers,
    mockResolvers,
    MockScope,
    mockScope,
    MockTelemetry,
    mockTelemetry,
    MockTranspile,
    mockTranspile,
    MockAbstractTranspile,
} from '../lib/core.mock';

describe('MockCore', () => {
    beforeEach(() => {
        MockCore.resetAll();
    });

    it('should expose mock classes as static properties', () => {
        expect(MockCore.Config).toBe(MockConfig);
        expect(MockCore.Compile).toBe(MockCompile);
        expect(MockCore.Hooks).toBe(MockHooks);
        expect(MockCore.HooksType).toBe(MockHooksType);
        expect(MockCore.Logger).toBe(MockLogger);
        expect(MockCore.Module).toBe(MockModule);
        expect(MockCore.Resolvers).toBe(MockResolvers);
        expect(MockCore.Scope).toBe(MockScope);
        expect(MockCore.Telemetry).toBe(MockTelemetry);
        expect(MockCore.Transpile).toBe(MockTranspile);
        expect(MockCore.AbstractTranspile).toBe(MockAbstractTranspile);
    });

    it('should create logger instance', () => {
        const logger = MockCore.createLogger('TestContext');
        expect(logger).toBeInstanceOf(MockLogger);
        expect(logger.context).toBe('TestContext');
    });

    it('should create module instance', () => {
        const options = { devMode: true };
        const module = MockCore.createModule('TestModule', options);
        expect(module).toBeInstanceOf(MockModule);
        expect(module.devMode).toBe(true);
    });

    it('should create transpile instance', () => {
        const transpile = MockCore.createTranspile();
        expect(transpile).toBeInstanceOf(MockTranspile);
    });

    it('should create abstract transpile instance', () => {
        const abstractTranspile = MockCore.createAbstractTranspile();
        expect(abstractTranspile).toBeInstanceOf(MockAbstractTranspile);
    });

    it('should reset all mocks', () => {
        // Configurar alguns mocks
        MockConfig.set('test.key', 'value');
        MockHooks.add(MockHooksType.Log, () => {});

        // Verificar que os mocks foram configurados
        expect(MockConfig.get('test.key')).toBe('value');
        expect(MockHooks.has(MockHooksType.Log)).toBe(true);

        // Reset
        MockCore.resetAll();

        // Verificar que os mocks foram resetados
        expect(MockConfig.get('test.key')).toBeUndefined();
        expect(MockHooks.has(MockHooksType.Log)).toBe(false);
    });

    it('should get complete core mock', () => {
        const core = MockCore.getCore();

        // Verificar que contém todas as propriedades
        expect(core).toHaveProperty('Config', MockConfig);
        expect(core).toHaveProperty('Compile', MockCompile);
        expect(core).toHaveProperty('Hooks', MockHooks);
        expect(core).toHaveProperty('HooksType', MockHooksType);
        expect(core).toHaveProperty('Logger', MockLogger);
        expect(core).toHaveProperty('Module', MockModule);
        expect(core).toHaveProperty('Resolvers', MockResolvers);
        expect(core).toHaveProperty('Scope', MockScope);
        expect(core).toHaveProperty('Telemetry', MockTelemetry);
        expect(core).toHaveProperty('Transpile', MockTranspile);
        expect(core).toHaveProperty('AbstractTranspile', MockAbstractTranspile);

        // Verificar Singleton
        expect(core).toHaveProperty('Singleton');
        expect(typeof core.Singleton).toBe('function');

        // Testar Singleton
        const instance1 = core.Singleton.getInstance();
        const instance2 = core.Singleton.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should expose mockCore as an alias', () => {
        expect(mockCore).toBe(MockCore);
    });

    it('should verify exports match their corresponding mock classes', () => {
        // Verificar que as exportações correspondem às suas classes mock
        expect(mockConfig).toBe(MockConfig);
        expect(mockCompile).toBe(MockCompile);
        expect(mockHooks).toBe(MockHooks);
        expect(mockLogger).toBe(MockLogger);
        expect(mockModule).toBe(MockModule);
        expect(mockResolvers).toBe(MockResolvers);
        expect(mockScope).toBe(MockScope);
        expect(mockTelemetry).toBe(MockTelemetry);
        expect(mockTranspile).toBe(MockTranspile);
    });

    it('should work with a complete integration example', () => {
        MockConfig.setup({
            server: { port: 3000 },
        });

        const logHook = vi.fn();
        MockHooks.add(MockHooksType.Log, logHook);

        expect(MockConfig.get('server.port')).toBe(3000);
        MockHooks.execute(MockHooksType.Log, { message: 'test' });
        expect(logHook).toHaveBeenCalledWith({ message: 'test' });
    });
});
