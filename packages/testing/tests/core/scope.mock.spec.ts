import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockScope, mockScope } from '../../core/scope.mock';
import { MockModule } from '../../core/module.mock';

// Mocking do módulo do core que contém o Scope
vi.mock('@cmmv/core/lib/scope', () => {
    return {
        Scope: MockScope,
        Module: MockModule,
    };
});

describe('MockScope', () => {
    beforeEach(() => {
        MockScope.reset();
    });

    it('should set and get values', () => {
        MockScope.set('testKey', 'testValue');

        expect(MockScope.set).toHaveBeenCalledWith('testKey', 'testValue');
        expect(MockScope.get('testKey')).toBe('testValue');
        expect(MockScope.get).toHaveBeenCalledWith('testKey');
    });

    it('should check if a key exists', () => {
        MockScope.set('existingKey', 'value');

        expect(MockScope.has('existingKey')).toBe(true);
        expect(MockScope.has('nonExistingKey')).toBe(false);
        expect(MockScope.has).toHaveBeenCalledWith('existingKey');
        expect(MockScope.has).toHaveBeenCalledWith('nonExistingKey');
    });

    it('should clear a key', () => {
        MockScope.set('keyToClear', 'value');
        expect(MockScope.get('keyToClear')).toBe('value');

        MockScope.clear('keyToClear');

        expect(MockScope.clear).toHaveBeenCalledWith('keyToClear');
        expect(MockScope.get('keyToClear')).toBeNull();
    });

    it('should work with arrays', () => {
        MockScope.addToArray('myArray', 'item1');
        MockScope.addToArray('myArray', 'item2');

        expect(MockScope.addToArray).toHaveBeenCalledWith('myArray', 'item1');
        expect(MockScope.addToArray).toHaveBeenCalledWith('myArray', 'item2');

        const array = MockScope.getArray('myArray');
        expect(array).toEqual(['item1', 'item2']);
        expect(MockScope.getArray).toHaveBeenCalledWith('myArray');

        expect(MockScope.getArrayFromIndex('myArray', 0)).toBe('item1');
        expect(MockScope.getArrayFromIndex('myArray', 1)).toBe('item2');
        expect(MockScope.getArrayFromIndex).toHaveBeenCalledWith('myArray', 0);
        expect(MockScope.getArrayFromIndex).toHaveBeenCalledWith('myArray', 1);

        MockScope.removeFromArray('myArray', 'item1');
        expect(MockScope.removeFromArray).toHaveBeenCalledWith(
            'myArray',
            'item1',
        );

        const updatedArray = MockScope.getArray('myArray');
        expect(updatedArray).toEqual(['item2']);
    });

    it('should reset all data and spies', () => {
        MockScope.set('key1', 'value1');
        MockScope.addToArray('array1', 'item1');

        MockScope.get('key1');
        MockScope.has('key1');
        MockScope.getArray('array1');

        const setCallsCount = MockScope.set.mock.calls.length;
        const getCallsCount = MockScope.get.mock.calls.length;
        const hasCallsCount = MockScope.has.mock.calls.length;

        MockScope.reset();

        expect(MockScope.get('key1')).toBeNull();
        expect(MockScope.getArray('array1')).toBeNull();

        expect(MockScope.set.mock.calls.length).toBe(0);
        expect(MockScope.get.mock.calls.length).toBe(1);
        expect(MockScope.has.mock.calls.length).toBe(0);
    });

    it('should handle addToArray on non-array correctly', () => {
        MockScope.set('nonArray', 'string value');
        const result = MockScope.addToArray('nonArray', 'new item');
        expect(result).toBe(false);
    });

    it('should handle removeFromArray when item not in array', () => {
        MockScope.addToArray('testArray', 'item1');
        const result = MockScope.removeFromArray('testArray', 'nonExistent');
        expect(result).toBe(false);
    });

    it('should get mock module with Scope class', () => {
        const mockModule = MockScope.getMockModule();
        expect(mockModule).toHaveProperty('Scope');
        expect(mockModule.Scope).toBe(MockScope);
    });

    it('should expose mockScope as an alias', () => {
        expect(mockScope).toBe(MockScope);
    });
});
