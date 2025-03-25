import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Cache } from '../lib/cache.decorator';

describe('Cache Decorator', () => {
    it('should register a cache handler with the correct key and options', () => {
        class TestClass {
            @Cache('testKey', { ttl: 300, compress: true })
            public testMethod() {
                return 'test';
            }
        }

        const instance = new TestClass();
        const metadata = Reflect.getMetadata(
            'cache_metadata',
            instance.testMethod,
        );

        expect(metadata).toEqual({
            handler: 'testMethod',
            key: 'testKey',
            options: { ttl: 300, compress: true },
        });
    });

    it('should register a cache handler without options', () => {
        class TestClass {
            @Cache('testKey')
            public testMethod() {
                return 'test';
            }
        }

        const instance = new TestClass();
        const metadata = Reflect.getMetadata(
            'cache_metadata',
            instance.testMethod,
        );

        expect(metadata).toEqual({
            handler: 'testMethod',
            key: 'testKey',
            options: undefined,
        });
    });

    it('should register handler for a method without crashing', () => {
        class TestClass {
            @Cache('simpleKey')
            public simpleMethod() {
                return 'simple';
            }
        }

        const instance = new TestClass();
        const metadata = Reflect.getMetadata(
            'cache_metadata',
            instance.simpleMethod,
        );

        expect(metadata.key).toBe('simpleKey');
        expect(metadata.handler).toBe('simpleMethod');
    });

    it('should call the cached method correctly', () => {
        class TestClass {
            @Cache('methodKey', { ttl: 500 })
            public cachedMethod(a: number, b: number) {
                return a + b;
            }
        }

        const instance = new TestClass();
        const result = instance.cachedMethod(2, 3);

        expect(result).toBe(5);
    });

    it('should handle multiple methods with different cache keys', () => {
        class TestClass {
            @Cache('keyOne', { ttl: 300 })
            public methodOne() {
                return 'one';
            }

            @Cache('keyTwo', { ttl: 600 })
            public methodTwo() {
                return 'two';
            }
        }

        const instance = new TestClass();
        const methodOneMetadata = Reflect.getMetadata(
            'cache_metadata',
            instance.methodOne,
        );
        const methodTwoMetadata = Reflect.getMetadata(
            'cache_metadata',
            instance.methodTwo,
        );

        expect(methodOneMetadata.key).toBe('keyOne');
        expect(methodTwoMetadata.key).toBe('keyTwo');
        expect(methodOneMetadata.options.ttl).toBe(300);
        expect(methodTwoMetadata.options.ttl).toBe(600);
    });

    it('should support cache options with compression enabled', () => {
        class TestClass {
            @Cache('compressKey', { compress: true })
            public compressedMethod() {
                return 'compressed result';
            }
        }

        const instance = new TestClass();
        const metadata = Reflect.getMetadata(
            'cache_metadata',
            instance.compressedMethod,
        );

        expect(metadata.key).toBe('compressKey');
        expect(metadata.options.compress).toBe(true);
    });

    it('should apply cache metadata even with a complex cache key structure', () => {
        class TestClass {
            @Cache('complex:key:structure', { ttl: 400 })
            public complexKeyMethod() {
                return 'complex key';
            }
        }

        const instance = new TestClass();
        const metadata = Reflect.getMetadata(
            'cache_metadata',
            instance.complexKeyMethod,
        );

        expect(metadata.key).toBe('complex:key:structure');
        expect(metadata.options.ttl).toBe(400);
    });
});
