"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("reflect-metadata");
const vitest_1 = require("vitest");
const metadata_decorator_1 = require("../../decorators/metadata.decorator");
(0, vitest_1.describe)('SetMetadata Decorator', () => {
    (0, vitest_1.it)('should set metadata on a class', () => {
        const METADATA_KEY = 'custom:metadata';
        const METADATA_VALUE = 'someValue';
        let TestClass = class TestClass {
        };
        TestClass = tslib_1.__decorate([
            (0, metadata_decorator_1.SetMetadata)(METADATA_KEY, METADATA_VALUE)
        ], TestClass);
        const metadata = Reflect.getMetadata(METADATA_KEY, TestClass);
        (0, vitest_1.expect)(metadata).toBe(METADATA_VALUE);
    });
    (0, vitest_1.it)('should set metadata on a method', () => {
        const METADATA_KEY = 'custom:metadata';
        const METADATA_VALUE = 'someMethodValue';
        class TestClass {
            testMethod() { }
        }
        tslib_1.__decorate([
            (0, metadata_decorator_1.SetMetadata)(METADATA_KEY, METADATA_VALUE),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "testMethod", null);
        const methodMetadata = Reflect.getMetadata(METADATA_KEY, TestClass.prototype.testMethod);
        (0, vitest_1.expect)(methodMetadata).toBe(METADATA_VALUE);
    });
    (0, vitest_1.it)('should set different metadata on multiple methods', () => {
        const METADATA_KEY1 = 'custom:metadata1';
        const METADATA_VALUE1 = 'methodValue1';
        const METADATA_KEY2 = 'custom:metadata2';
        const METADATA_VALUE2 = 'methodValue2';
        class TestClass {
            methodOne() { }
            methodTwo() { }
        }
        tslib_1.__decorate([
            (0, metadata_decorator_1.SetMetadata)(METADATA_KEY1, METADATA_VALUE1),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "methodOne", null);
        tslib_1.__decorate([
            (0, metadata_decorator_1.SetMetadata)(METADATA_KEY2, METADATA_VALUE2),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "methodTwo", null);
        const methodOneMetadata = Reflect.getMetadata(METADATA_KEY1, TestClass.prototype.methodOne);
        const methodTwoMetadata = Reflect.getMetadata(METADATA_KEY2, TestClass.prototype.methodTwo);
        (0, vitest_1.expect)(methodOneMetadata).toBe(METADATA_VALUE1);
        (0, vitest_1.expect)(methodTwoMetadata).toBe(METADATA_VALUE2);
    });
    (0, vitest_1.it)('should return the decorator with KEY property', () => {
        const METADATA_KEY = 'custom:metadataKey';
        const METADATA_VALUE = 'keyValue';
        const decorator = (0, metadata_decorator_1.SetMetadata)(METADATA_KEY, METADATA_VALUE);
        (0, vitest_1.expect)(decorator.KEY).toBe(METADATA_KEY);
    });
    (0, vitest_1.it)('should apply the decorator on both methods and classes', () => {
        const METADATA_KEY = 'custom:universal';
        const METADATA_VALUE = 'universalValue';
        let TestClass = class TestClass {
            method() { }
        };
        tslib_1.__decorate([
            (0, metadata_decorator_1.SetMetadata)(METADATA_KEY, METADATA_VALUE),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "method", null);
        TestClass = tslib_1.__decorate([
            (0, metadata_decorator_1.SetMetadata)(METADATA_KEY, METADATA_VALUE)
        ], TestClass);
        const classMetadata = Reflect.getMetadata(METADATA_KEY, TestClass);
        const methodMetadata = Reflect.getMetadata(METADATA_KEY, TestClass.prototype.method);
        (0, vitest_1.expect)(classMetadata).toBe(METADATA_VALUE);
        (0, vitest_1.expect)(methodMetadata).toBe(METADATA_VALUE);
    });
    (0, vitest_1.it)('should return descriptor when applied on a method', () => {
        const METADATA_KEY = 'custom:metadata';
        const METADATA_VALUE = 'descriptorValue';
        class TestClass {
            method() { }
        }
        tslib_1.__decorate([
            (0, metadata_decorator_1.SetMetadata)(METADATA_KEY, METADATA_VALUE),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "method", null);
        const descriptor = Object.getOwnPropertyDescriptor(TestClass.prototype, 'method');
        (0, vitest_1.expect)(descriptor).not.toBeUndefined();
        (0, vitest_1.expect)(typeof descriptor.value).toBe('function');
    });
});
