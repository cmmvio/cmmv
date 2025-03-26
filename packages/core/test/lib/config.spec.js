"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const config_1 = require("../../lib/config");
(0, vitest_1.describe)('Config', () => {
    (0, vitest_1.beforeEach)(() => {
        config_1.Config.clear();
    });
    (0, vitest_1.it)('should get a configuration value by key', () => {
        const configData = { key: 'value', nested: { key: 'nestedValue' } };
        config_1.Config.assign(configData);
        (0, vitest_1.expect)(config_1.Config.get('key')).toBe('value');
        (0, vitest_1.expect)(config_1.Config.get('nested.key')).toBe('nestedValue');
        (0, vitest_1.expect)(config_1.Config.get('nonexistent.key')).toBeUndefined();
    });
    (0, vitest_1.it)('should check if a configuration key exists', () => {
        const configData = { key: 'value', nested: { key: 'nestedValue' } };
        config_1.Config.assign(configData);
        (0, vitest_1.expect)(config_1.Config.has('key')).toBe(true);
        (0, vitest_1.expect)(config_1.Config.has('nested.key')).toBe(true);
        (0, vitest_1.expect)(config_1.Config.has('nonexistent.key')).toBe(false);
    });
    (0, vitest_1.it)('should set a configuration value by key', () => {
        config_1.Config.set('key', 'value');
        (0, vitest_1.expect)(config_1.Config.get('key')).toBe('value');
        config_1.Config.set('nested.key', 'nestedValue');
        (0, vitest_1.expect)(config_1.Config.get('nested.key')).toBe('nestedValue');
    });
    (0, vitest_1.it)('should delete a configuration value by key', () => {
        config_1.Config.set('key', 'value');
        (0, vitest_1.expect)(config_1.Config.get('key')).toBe('value');
        config_1.Config.delete('key');
        (0, vitest_1.expect)(config_1.Config.get('key')).toBeUndefined();
        config_1.Config.set('nested.key', 'nestedValue');
        (0, vitest_1.expect)(config_1.Config.get('nested.key')).toBe('nestedValue');
        config_1.Config.delete('nested.key');
        (0, vitest_1.expect)(config_1.Config.get('nested.key')).toBeUndefined();
    });
    (0, vitest_1.it)('should return all configuration values', () => {
        const configData = { key: 'value', nested: { key: 'nestedValue' } };
        config_1.Config.assign(configData);
        (0, vitest_1.expect)(config_1.Config.getAll()).toEqual(configData);
    });
    (0, vitest_1.it)('should return default value if configuration key does not exist', () => {
        const defaultValue = 'defaultValue';
        (0, vitest_1.expect)(config_1.Config.get('nonexistent.key', defaultValue)).toBe(defaultValue);
    });
    (0, vitest_1.it)('should merge configurations using assign method', () => {
        const configData1 = { key1: 'value1' };
        const configData2 = { key2: 'value2', key1: 'newValue1' };
        config_1.Config.assign(configData1);
        config_1.Config.assign(configData2);
        const expectedConfig = { key1: 'newValue1', key2: 'value2' };
        (0, vitest_1.expect)(config_1.Config.getAll()).toEqual(expectedConfig);
    });
    (0, vitest_1.it)('should clear all configurations', () => {
        const configData = { key: 'value', nested: { key: 'nestedValue' } };
        config_1.Config.assign(configData);
        (0, vitest_1.expect)(config_1.Config.getAll()).toEqual(configData);
        config_1.Config.clear();
        (0, vitest_1.expect)(config_1.Config.getAll()).toEqual({});
    });
    (0, vitest_1.it)('should handle deeply nested keys in set, get, and delete methods', () => {
        config_1.Config.set('deep.nested.key', 'deepValue');
        (0, vitest_1.expect)(config_1.Config.get('deep.nested.key')).toBe('deepValue');
        config_1.Config.delete('deep.nested.key');
        (0, vitest_1.expect)(config_1.Config.get('deep.nested.key')).toBeUndefined();
    });
    (0, vitest_1.it)('should handle assigning empty objects', () => {
        config_1.Config.assign({});
        (0, vitest_1.expect)(config_1.Config.getAll()).toEqual({});
        config_1.Config.assign({ key: 'value' });
        (0, vitest_1.expect)(config_1.Config.getAll()).toEqual({ key: 'value' });
        config_1.Config.assign({});
        (0, vitest_1.expect)(config_1.Config.getAll()).toEqual({ key: 'value' });
    });
});
