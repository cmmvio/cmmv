"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const scope_1 = require("../../lib/scope");
(0, vitest_1.describe)('Scope', () => {
    (0, vitest_1.beforeEach)(() => {
        // Clear any existing data before each test to ensure isolation
        scope_1.Scope.clear('testData');
        scope_1.Scope.clear('testArray');
    });
    (0, vitest_1.it)('should set and retrieve data by name', () => {
        const result = scope_1.Scope.set('testData', { key: 'value' });
        (0, vitest_1.expect)(result).toBe(true);
        const data = scope_1.Scope.get('testData');
        (0, vitest_1.expect)(data).toEqual({ key: 'value' });
    });
    (0, vitest_1.it)('should not overwrite existing data', () => {
        scope_1.Scope.set('testData', { key: 'value1' });
        const result = scope_1.Scope.set('testData', { key: 'value2' });
        (0, vitest_1.expect)(result).toBe(false);
        const data = scope_1.Scope.get('testData');
        (0, vitest_1.expect)(data).toEqual({ key: 'value1' });
    });
    (0, vitest_1.it)('should return true if data exists', () => {
        scope_1.Scope.set('testData', { key: 'value' });
        (0, vitest_1.expect)(scope_1.Scope.has('testData')).toBe(true);
    });
    (0, vitest_1.it)('should return false if data does not exist', () => {
        (0, vitest_1.expect)(scope_1.Scope.has('nonExistentData')).toBe(false);
    });
    (0, vitest_1.it)('should return null for non-existent data', () => {
        const data = scope_1.Scope.get('nonExistentData');
        (0, vitest_1.expect)(data).toBe(null);
    });
    (0, vitest_1.it)('should clear data by name', () => {
        scope_1.Scope.set('testData', { key: 'value' });
        scope_1.Scope.clear('testData');
        const data = scope_1.Scope.get('testData');
        (0, vitest_1.expect)(data).toBe(null);
    });
    (0, vitest_1.it)('should add to an array in scope', () => {
        const result1 = scope_1.Scope.addToArray('testArray', 'value1');
        const result2 = scope_1.Scope.addToArray('testArray', 'value2');
        (0, vitest_1.expect)(result1).toBe(true);
        (0, vitest_1.expect)(result2).toBe(true);
        const array = scope_1.Scope.getArray('testArray');
        (0, vitest_1.expect)(array).toEqual(['value1', 'value2']);
    });
    (0, vitest_1.it)('should not add to non-array data', () => {
        scope_1.Scope.set('testData', { key: 'value' });
        const result = scope_1.Scope.addToArray('testData', 'value2');
        (0, vitest_1.expect)(result).toBe(false);
    });
    (0, vitest_1.it)('should remove from an array in scope', () => {
        scope_1.Scope.addToArray('testArray', 'value1');
        scope_1.Scope.addToArray('testArray', 'value2');
        const result = scope_1.Scope.removeFromArray('testArray', 'value1');
        (0, vitest_1.expect)(result).toBe(true);
        const array = scope_1.Scope.getArray('testArray');
        (0, vitest_1.expect)(array).toEqual(['value2']);
    });
    (0, vitest_1.it)('should not remove from non-array data', () => {
        scope_1.Scope.set('testData', { key: 'value' });
        const result = scope_1.Scope.removeFromArray('testData', 'value2');
        (0, vitest_1.expect)(result).toBe(false);
    });
    (0, vitest_1.it)('should return array from scope', () => {
        scope_1.Scope.addToArray('testArray', 'value1');
        scope_1.Scope.addToArray('testArray', 'value2');
        const array = scope_1.Scope.getArray('testArray');
        (0, vitest_1.expect)(array).toEqual(['value1', 'value2']);
    });
    (0, vitest_1.it)('should return null if scope data is not an array', () => {
        scope_1.Scope.set('testData', { key: 'value' });
        const array = scope_1.Scope.getArray('testData');
        (0, vitest_1.expect)(array).toBe(null);
    });
    (0, vitest_1.it)('should return array element by index', () => {
        scope_1.Scope.addToArray('testArray', 'value1');
        scope_1.Scope.addToArray('testArray', 'value2');
        const element = scope_1.Scope.getArrayFromIndex('testArray', 1);
        (0, vitest_1.expect)(element).toBe('value2');
    });
    (0, vitest_1.it)('should return null for out of bounds index', () => {
        scope_1.Scope.addToArray('testArray', 'value1');
        const element = scope_1.Scope.getArrayFromIndex('testArray', 2);
        (0, vitest_1.expect)(element).toBe(null);
    });
});
