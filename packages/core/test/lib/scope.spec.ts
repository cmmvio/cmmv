import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scope } from '../../lib/scope';

vi.mock('../../lib/module', () => ({
    Module: vi.fn(),
}));

describe('Scope', () => {
    beforeEach(() => {
        Scope.clear('testData');
        Scope.clear('testArray');
    });

    it('should set and retrieve data by name', () => {
        const result = Scope.set('testData', { key: 'value' });
        expect(result).toBe(true);

        const data = Scope.get<{ key: string }>('testData');
        expect(data).toEqual({ key: 'value' });
    });

    it('should not overwrite existing data', () => {
        Scope.set('testData', { key: 'value1' });
        const result = Scope.set('testData', { key: 'value2' });

        expect(result).toBe(false);
        const data = Scope.get<{ key: string }>('testData');
        expect(data).toEqual({ key: 'value1' });
    });

    it('should return true if data exists', () => {
        Scope.set('testData', { key: 'value' });
        expect(Scope.has('testData')).toBe(true);
    });

    it('should return false if data does not exist', () => {
        expect(Scope.has('nonExistentData')).toBe(false);
    });

    it('should return null for non-existent data', () => {
        const data = Scope.get('nonExistentData');
        expect(data).toBe(null);
    });

    it('should clear data by name', () => {
        Scope.set('testData', { key: 'value' });
        Scope.clear('testData');

        const data = Scope.get('testData');
        expect(data).toBe(null);
    });

    it('should add to an array in scope', () => {
        const result1 = Scope.addToArray('testArray', 'value1');
        const result2 = Scope.addToArray('testArray', 'value2');

        expect(result1).toBe(true);
        expect(result2).toBe(true);

        const array = Scope.getArray<string>('testArray');
        expect(array).toEqual(['value1', 'value2']);
    });

    it('should not add to non-array data', () => {
        Scope.set('testData', { key: 'value' });
        const result = Scope.addToArray('testData', 'value2');

        expect(result).toBe(false);
    });

    it('should remove from an array in scope', () => {
        Scope.addToArray('testArray', 'value1');
        Scope.addToArray('testArray', 'value2');

        const result = Scope.removeFromArray('testArray', 'value1');
        expect(result).toBe(true);

        const array = Scope.getArray<string>('testArray');
        expect(array).toEqual(['value2']);
    });

    it('should not remove from non-array data', () => {
        Scope.set('testData', { key: 'value' });
        const result = Scope.removeFromArray('testData', 'value2');

        expect(result).toBe(false);
    });

    it('should return array from scope', () => {
        Scope.addToArray('testArray', 'value1');
        Scope.addToArray('testArray', 'value2');

        const array = Scope.getArray<string>('testArray');
        expect(array).toEqual(['value1', 'value2']);
    });

    it('should return null if scope data is not an array', () => {
        Scope.set('testData', { key: 'value' });

        const array = Scope.getArray<string>('testData');
        expect(array).toBe(null);
    });

    it('should return array element by index', () => {
        Scope.addToArray('testArray', 'value1');
        Scope.addToArray('testArray', 'value2');

        const element = Scope.getArrayFromIndex<string>('testArray', 1);
        expect(element).toBe('value2');
    });

    it('should return null for out of bounds index', () => {
        Scope.addToArray('testArray', 'value1');

        const element = Scope.getArrayFromIndex<string>('testArray', 2);
        expect(element).toBe(null);
    });
});
