import { describe, it, expect, beforeEach } from 'vitest';
import { Config } from '../../lib/config';

describe('Config', () => {
    beforeEach(() => {
        Config.clear();
    });

    it('should get a configuration value by key', () => {
        const configData = { key: 'value', nested: { key: 'nestedValue' } };
        Config.assign(configData);

        expect(Config.get('key')).toBe('value');
        expect(Config.get('nested.key')).toBe('nestedValue');
        expect(Config.get('nonexistent.key')).toBeUndefined();
    });

    it('should check if a configuration key exists', () => {
        const configData = { key: 'value', nested: { key: 'nestedValue' } };
        Config.assign(configData);

        expect(Config.has('key')).toBe(true);
        expect(Config.has('nested.key')).toBe(true);
        expect(Config.has('nonexistent.key')).toBe(false);
    });

    it('should set a configuration value by key', () => {
        Config.set('key', 'value');
        expect(Config.get('key')).toBe('value');

        Config.set('nested.key', 'nestedValue');
        expect(Config.get('nested.key')).toBe('nestedValue');
    });

    it('should delete a configuration value by key', () => {
        Config.set('key', 'value');
        expect(Config.get('key')).toBe('value');

        Config.delete('key');
        expect(Config.get('key')).toBeUndefined();

        Config.set('nested.key', 'nestedValue');
        expect(Config.get('nested.key')).toBe('nestedValue');

        Config.delete('nested.key');
        expect(Config.get('nested.key')).toBeUndefined();
    });

    it('should return all configuration values', () => {
        const configData = { key: 'value', nested: { key: 'nestedValue' } };
        Config.assign(configData);

        expect(Config.getAll()).toEqual(configData);
    });

    it('should return default value if configuration key does not exist', () => {
        const defaultValue = 'defaultValue';
        expect(Config.get('nonexistent.key', defaultValue)).toBe(defaultValue);
    });

    it('should merge configurations using assign method', () => {
        const configData1 = { key1: 'value1' };
        const configData2 = { key2: 'value2', key1: 'newValue1' };

        Config.assign(configData1);
        Config.assign(configData2);

        const expectedConfig = { key1: 'newValue1', key2: 'value2' };
        expect(Config.getAll()).toEqual(expectedConfig);
    });

    it('should clear all configurations', () => {
        const configData = { key: 'value', nested: { key: 'nestedValue' } };
        Config.assign(configData);

        expect(Config.getAll()).toEqual(configData);

        Config.clear();
        expect(Config.getAll()).toEqual({});
    });

    it('should handle deeply nested keys in set, get, and delete methods', () => {
        Config.set('deep.nested.key', 'deepValue');
        expect(Config.get('deep.nested.key')).toBe('deepValue');

        Config.delete('deep.nested.key');
        expect(Config.get('deep.nested.key')).toBeUndefined();
    });

    it('should handle assigning empty objects', () => {
        Config.assign({});
        expect(Config.getAll()).toEqual({});

        Config.assign({ key: 'value' });
        expect(Config.getAll()).toEqual({ key: 'value' });

        Config.assign({});
        expect(Config.getAll()).toEqual({ key: 'value' });
    });
});
