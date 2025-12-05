import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'reflect-metadata';
import { Resolver } from '../../decorators/resolver.decorator';
import { Resolvers } from '../../lib/resolvers';

describe('Resolver Decorator', () => {
    beforeEach(() => {
        // Reset Resolvers singleton
        (Resolvers as any).instance = undefined;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('basic functionality', () => {
        it('should register resolver with given namespace', async () => {
            class TestService {
                @Resolver('test.namespace')
                async testMethod() {
                    return 'result';
                }
            }

            expect(Resolvers.has('test.namespace')).toBe(true);
        });

        it('should execute the decorated method when resolver is called', async () => {
            const mockFn = vi.fn().mockResolvedValue('result');

            class TestService {
                @Resolver('test.execute')
                async testMethod(...args: any[]) {
                    return mockFn(...args);
                }
            }

            await Resolvers.execute('test.execute', 'arg1', 'arg2');

            expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should return the result from the decorated method', async () => {
            class TestService {
                @Resolver('test.return')
                async testMethod() {
                    return 'expected result';
                }
            }

            const result = await Resolvers.execute('test.return');

            expect(result).toBe('expected result');
        });
    });

    describe('multiple resolvers', () => {
        it('should register multiple resolvers with different namespaces', () => {
            class TestService {
                @Resolver('namespace.one')
                async methodOne() {
                    return 'one';
                }

                @Resolver('namespace.two')
                async methodTwo() {
                    return 'two';
                }
            }

            expect(Resolvers.has('namespace.one')).toBe(true);
            expect(Resolvers.has('namespace.two')).toBe(true);
        });

        it('should execute correct resolver for each namespace', async () => {
            class TestService {
                @Resolver('service.get')
                async getMethod() {
                    return 'get result';
                }

                @Resolver('service.set')
                async setMethod(value: string) {
                    return `set: ${value}`;
                }
            }

            const getResult = await Resolvers.execute('service.get');
            const setResult = await Resolvers.execute('service.set', 'value');

            expect(getResult).toBe('get result');
            expect(setResult).toBe('set: value');
        });
    });

    describe('error handling', () => {
        it('should throw error when decorator is applied to non-function', () => {
            // Test the error by directly calling the decorator with a non-function
            const decorator = Resolver('invalid.namespace');
            const descriptor = { value: 'not a function' };

            expect(() => {
                decorator({}, 'propertyName', descriptor as any);
            }).toThrow('@Resolver can only be used on methods.');
        });

        it('should propagate errors from decorated method', async () => {
            class TestService {
                @Resolver('error.namespace')
                async errorMethod() {
                    throw new Error('Method error');
                }
            }

            await expect(Resolvers.execute('error.namespace')).rejects.toThrow(
                'Method error',
            );
        });
    });

    describe('async behavior', () => {
        it('should handle async methods', async () => {
            class TestService {
                @Resolver('async.method')
                async asyncMethod() {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    return 'async result';
                }
            }

            const result = await Resolvers.execute('async.method');
            expect(result).toBe('async result');
        });

        it('should handle sync methods wrapped in async', async () => {
            class TestService {
                @Resolver('sync.method')
                syncMethod() {
                    return 'sync result';
                }
            }

            const result = await Resolvers.execute('sync.method');
            expect(result).toBe('sync result');
        });
    });

    describe('arguments passing', () => {
        it('should pass multiple arguments to method', async () => {
            class TestService {
                @Resolver('args.test')
                async methodWithArgs(a: number, b: number, c: number) {
                    return a + b + c;
                }
            }

            const result = await Resolvers.execute('args.test', 1, 2, 3);
            expect(result).toBe(6);
        });

        it('should pass object arguments', async () => {
            class TestService {
                @Resolver('object.args')
                async methodWithObject(obj: { name: string; value: number }) {
                    return `${obj.name}: ${obj.value}`;
                }
            }

            const result = await Resolvers.execute('object.args', {
                name: 'test',
                value: 42,
            });
            expect(result).toBe('test: 42');
        });

        it('should pass array arguments', async () => {
            class TestService {
                @Resolver('array.args')
                async methodWithArray(items: string[]) {
                    return items.join(', ');
                }
            }

            const result = await Resolvers.execute('array.args', [
                'a',
                'b',
                'c',
            ]);
            expect(result).toBe('a, b, c');
        });
    });
});
