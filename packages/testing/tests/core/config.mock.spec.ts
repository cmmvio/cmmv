import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockConfig, mockConfig } from '../../core/config.mock';

describe('MockConfig', () => {
    beforeEach(() => {
        MockConfig.reset();
    });

    it('should get and set config values', () => {
        MockConfig.set('server.port', 3000);
        expect(MockConfig.get('server.port')).toBe(3000);
        expect(MockConfig.get).toHaveBeenCalledWith('server.port');
        expect(MockConfig.set).toHaveBeenCalledWith('server.port', 3000);
    });

    it('should return default value when config key does not exist', () => {
        expect(MockConfig.get('nonexistent.key', 'default')).toBe('default');
        expect(MockConfig.get).toHaveBeenCalledWith(
            'nonexistent.key',
            'default',
        );
    });

    it('should check if config key exists', () => {
        MockConfig.set('feature.enabled', true);
        expect(MockConfig.has('feature.enabled')).toBe(true);
        expect(MockConfig.has('feature.disabled')).toBe(false);
        expect(MockConfig.has).toHaveBeenCalledWith('feature.enabled');
        expect(MockConfig.has).toHaveBeenCalledWith('feature.disabled');
    });

    it('should delete config key', () => {
        MockConfig.set('temp.value', 'to-be-deleted');
        expect(MockConfig.get('temp.value')).toBe('to-be-deleted');

        MockConfig.delete('temp.value');
        expect(MockConfig.has('temp.value')).toBe(false);
        expect(MockConfig.delete).toHaveBeenCalledWith('temp.value');
    });

    it('should return all config data', () => {
        MockConfig.set('server.host', 'localhost');
        MockConfig.set('server.port', 8080);

        const allConfig = MockConfig.getAll();
        expect(allConfig).toEqual({
            server: {
                host: 'localhost',
                port: 8080,
            },
        });
        expect(MockConfig.getAll).toHaveBeenCalled();
    });

    it('should assign config object', () => {
        const newConfig = {
            app: {
                name: 'TestApp',
                version: '1.0.0',
            },
        };

        MockConfig.assign(newConfig);

        expect(MockConfig.get('app.name')).toBe('TestApp');
        expect(MockConfig.get('app.version')).toBe('1.0.0');
        expect(MockConfig.assign).toHaveBeenCalledWith(newConfig);
    });

    it('should clear all config data', () => {
        MockConfig.set('test.key', 'value');
        expect(MockConfig.get('test.key')).toBe('value');

        MockConfig.clear();

        expect(MockConfig.has('test.key')).toBe(false);
        expect(MockConfig.getAll()).toEqual({});
        expect(MockConfig.clear).toHaveBeenCalled();
    });

    it('should setup config with initial data', () => {
        const initialConfig = {
            database: {
                url: 'mongodb://localhost:27017',
                name: 'testdb',
            },
        };

        MockConfig.setup(initialConfig);

        expect(MockConfig.get('database.url')).toBe(
            'mongodb://localhost:27017',
        );
        expect(MockConfig.get('database.name')).toBe('testdb');
    });

    it('should handle nested properties correctly', () => {
        MockConfig.set('deeply.nested.property', 'value');
        expect(MockConfig.get('deeply.nested.property')).toBe('value');
        expect(MockConfig.get('deeply.nested')).toEqual({ property: 'value' });
        expect(MockConfig.get('deeply')).toEqual({
            nested: { property: 'value' },
        });
    });

    it('should reset all mocks and clear data', () => {
        // Configurar estado inicial
        MockConfig.set('test.key', 'value');

        // Guardar estado dos contadores antes do reset
        const setCallCount = MockConfig.set.mock.calls.length;
        const getCallCount = MockConfig.get.mock.calls.length;

        MockConfig.get('test.key');
        expect(MockConfig.get.mock.calls.length).toBe(getCallCount + 1);

        // Resetar os mocks
        MockConfig.reset();

        // Verificar que os dados foram limpos
        expect(MockConfig.getAll()).toEqual({});

        // Verificar que os contadores foram resetados
        expect(MockConfig.set.mock.calls.length).toBe(0);
        expect(MockConfig.get.mock.calls.length).toBe(0);
    });

    it('should validateConfigs be a mocked function', () => {
        expect(MockConfig.validateConfigs).toBeTypeOf('function');
        MockConfig.validateConfigs('test');
        expect(MockConfig.validateConfigs).toHaveBeenCalledWith('test');
    });

    it('should envMap be a mocked function', () => {
        expect(MockConfig.envMap).toBeTypeOf('function');
        MockConfig.envMap('ENV_VAR', 'config.path');
        expect(MockConfig.envMap).toHaveBeenCalledWith(
            'ENV_VAR',
            'config.path',
        );
    });

    it('should expose mockConfig as an alias', () => {
        expect(mockConfig).toBe(MockConfig);
    });

    it('should provide mock module structure', () => {
        const mockModule = MockConfig.getMockModule();
        expect(mockModule).toHaveProperty('Config', MockConfig);
    });
});
