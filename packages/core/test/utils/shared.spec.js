"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const shared_utils_1 = require("../../utils/shared.utils");
(0, vitest_1.describe)('Shared Utils', () => {
    (0, vitest_1.it)('should correctly identify undefined values', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isUndefined)(undefined)).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isUndefined)(null)).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify objects', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isObject)({})).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isObject)(null)).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify plain objects', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isPlainObject)({})).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isPlainObject)(new Date())).toBe(false);
    });
    (0, vitest_1.it)('should add leading slash to paths', () => {
        (0, vitest_1.expect)((0, shared_utils_1.addLeadingSlash)('test')).toBe('/test');
        (0, vitest_1.expect)((0, shared_utils_1.addLeadingSlash)('/test')).toBe('/test');
    });
    (0, vitest_1.it)('should normalize paths', () => {
        (0, vitest_1.expect)((0, shared_utils_1.normalizePath)('/test//path/')).toBe('/test/path');
    });
    (0, vitest_1.it)('should strip the ending slash from paths', () => {
        (0, vitest_1.expect)((0, shared_utils_1.stripEndSlash)('/test/')).toBe('/test');
        (0, vitest_1.expect)((0, shared_utils_1.stripEndSlash)('/test')).toBe('/test');
    });
    (0, vitest_1.it)('should correctly identify functions', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isFunction)(() => { })).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isFunction)('test')).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify strings', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isString)('test')).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isString)(123)).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify numbers', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isNumber)(123)).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isNumber)('test')).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify constructors', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isConstructor)('constructor')).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isConstructor)('notConstructor')).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify null or undefined values', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isNil)(null)).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isNil)(undefined)).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isNil)('test')).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify empty arrays', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isEmpty)([])).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isEmpty)([1, 2, 3])).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify symbols', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isSymbol)(Symbol())).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isSymbol)('test')).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify valid JSON strings', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isJSON)('{"key": "value"}')).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isJSON)('invalidJSON')).toBe(false);
    });
    (0, vitest_1.it)('should return false for non-undefined values in isUndefined', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isUndefined)(123)).toBe(false);
        (0, vitest_1.expect)((0, shared_utils_1.isUndefined)('string')).toBe(false);
        (0, vitest_1.expect)((0, shared_utils_1.isUndefined)({})).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify non-plain objects', () => {
        class CustomClass {
        }
        (0, vitest_1.expect)((0, shared_utils_1.isPlainObject)(new CustomClass())).toBe(false);
        (0, vitest_1.expect)((0, shared_utils_1.isPlainObject)(null)).toBe(false);
    });
    (0, vitest_1.it)('should not add leading slash if path is empty', () => {
        (0, vitest_1.expect)((0, shared_utils_1.addLeadingSlash)('')).toBe('/');
    });
    (0, vitest_1.it)('should handle paths with no need for normalization', () => {
        (0, vitest_1.expect)((0, shared_utils_1.normalizePath)('/simple')).toBe('/simple');
        (0, vitest_1.expect)((0, shared_utils_1.normalizePath)('simple/path')).toBe('/simple/path');
    });
    (0, vitest_1.it)('should correctly strip end slash even for root paths', () => {
        (0, vitest_1.expect)((0, shared_utils_1.stripEndSlash)('/')).toBe('');
        (0, vitest_1.expect)((0, shared_utils_1.stripEndSlash)('root/')).toBe('root');
    });
    (0, vitest_1.it)('should correctly identify arrow functions in isFunction', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isFunction)(function () { })).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isFunction)(() => { })).toBe(true);
        (0, vitest_1.expect)((0, shared_utils_1.isFunction)(null)).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify if a value is not a constructor', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isConstructor)('randomString')).toBe(false);
        (0, vitest_1.expect)((0, shared_utils_1.isConstructor)(Object)).toBe(false);
    });
    (0, vitest_1.it)('should return true for nested arrays in isEmpty', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isEmpty)([[]])).toBe(false);
        (0, vitest_1.expect)((0, shared_utils_1.isEmpty)([[1, 2, 3]])).toBe(false);
    });
    (0, vitest_1.it)('should return false for invalid JSON even with valid syntax', () => {
        (0, vitest_1.expect)((0, shared_utils_1.isJSON)('{key: value}')).toBe(false);
        (0, vitest_1.expect)((0, shared_utils_1.isJSON)('{"incompleteJson"')).toBe(false);
    });
});
