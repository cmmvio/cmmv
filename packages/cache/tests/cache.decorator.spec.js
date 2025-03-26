"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("reflect-metadata");
const vitest_1 = require("vitest");
const cache_decorator_1 = require("../lib/cache.decorator");
(0, vitest_1.describe)('Cache Decorator', () => {
    (0, vitest_1.it)('should register a cache handler with the correct key and options', () => {
        class TestClass {
            testMethod() {
                return 'test';
            }
        }
        tslib_1.__decorate([
            (0, cache_decorator_1.Cache)('testKey', { ttl: 300, compress: true }),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "testMethod", null);
        const instance = new TestClass();
        const metadata = Reflect.getMetadata('cache_metadata', instance.testMethod);
        (0, vitest_1.expect)(metadata).toEqual({
            handler: 'testMethod',
            key: 'testKey',
            options: { ttl: 300, compress: true },
        });
    });
    (0, vitest_1.it)('should register a cache handler without options', () => {
        class TestClass {
            testMethod() {
                return 'test';
            }
        }
        tslib_1.__decorate([
            (0, cache_decorator_1.Cache)('testKey'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "testMethod", null);
        const instance = new TestClass();
        const metadata = Reflect.getMetadata('cache_metadata', instance.testMethod);
        (0, vitest_1.expect)(metadata).toEqual({
            handler: 'testMethod',
            key: 'testKey',
            options: undefined,
        });
    });
    (0, vitest_1.it)('should register handler for a method without crashing', () => {
        class TestClass {
            simpleMethod() {
                return 'simple';
            }
        }
        tslib_1.__decorate([
            (0, cache_decorator_1.Cache)('simpleKey'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "simpleMethod", null);
        const instance = new TestClass();
        const metadata = Reflect.getMetadata('cache_metadata', instance.simpleMethod);
        (0, vitest_1.expect)(metadata.key).toBe('simpleKey');
        (0, vitest_1.expect)(metadata.handler).toBe('simpleMethod');
    });
    (0, vitest_1.it)('should call the cached method correctly', () => {
        class TestClass {
            cachedMethod(a, b) {
                return a + b;
            }
        }
        tslib_1.__decorate([
            (0, cache_decorator_1.Cache)('methodKey', { ttl: 500 }),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", [Number, Number]),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "cachedMethod", null);
        const instance = new TestClass();
        const result = instance.cachedMethod(2, 3);
        (0, vitest_1.expect)(result).toBe(5);
    });
    (0, vitest_1.it)('should handle multiple methods with different cache keys', () => {
        class TestClass {
            methodOne() {
                return 'one';
            }
            methodTwo() {
                return 'two';
            }
        }
        tslib_1.__decorate([
            (0, cache_decorator_1.Cache)('keyOne', { ttl: 300 }),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "methodOne", null);
        tslib_1.__decorate([
            (0, cache_decorator_1.Cache)('keyTwo', { ttl: 600 }),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "methodTwo", null);
        const instance = new TestClass();
        const methodOneMetadata = Reflect.getMetadata('cache_metadata', instance.methodOne);
        const methodTwoMetadata = Reflect.getMetadata('cache_metadata', instance.methodTwo);
        (0, vitest_1.expect)(methodOneMetadata.key).toBe('keyOne');
        (0, vitest_1.expect)(methodTwoMetadata.key).toBe('keyTwo');
        (0, vitest_1.expect)(methodOneMetadata.options.ttl).toBe(300);
        (0, vitest_1.expect)(methodTwoMetadata.options.ttl).toBe(600);
    });
    (0, vitest_1.it)('should support cache options with compression enabled', () => {
        class TestClass {
            compressedMethod() {
                return 'compressed result';
            }
        }
        tslib_1.__decorate([
            (0, cache_decorator_1.Cache)('compressKey', { compress: true }),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "compressedMethod", null);
        const instance = new TestClass();
        const metadata = Reflect.getMetadata('cache_metadata', instance.compressedMethod);
        (0, vitest_1.expect)(metadata.key).toBe('compressKey');
        (0, vitest_1.expect)(metadata.options.compress).toBe(true);
    });
    (0, vitest_1.it)('should apply cache metadata even with a complex cache key structure', () => {
        class TestClass {
            complexKeyMethod() {
                return 'complex key';
            }
        }
        tslib_1.__decorate([
            (0, cache_decorator_1.Cache)('complex:key:structure', { ttl: 400 }),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "complexKeyMethod", null);
        const instance = new TestClass();
        const metadata = Reflect.getMetadata('cache_metadata', instance.complexKeyMethod);
        (0, vitest_1.expect)(metadata.key).toBe('complex:key:structure');
        (0, vitest_1.expect)(metadata.options.ttl).toBe(400);
    });
});
