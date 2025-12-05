import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Resolvers } from '../../lib/resolvers';

describe('Resolvers', () => {
    beforeEach(() => {
        // Reset singleton instance
        (Resolvers as any).instance = undefined;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('add', () => {
        it('should add a resolver function for a given namespace', () => {
            const mockFn = vi.fn();
            Resolvers.add('test-namespace', mockFn);

            expect(Resolvers.has('test-namespace')).toBe(true);
        });

        it('should overwrite existing resolver for same namespace', () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();

            Resolvers.add('test-namespace', mockFn1);
            Resolvers.add('test-namespace', mockFn2);

            expect(Resolvers.has('test-namespace')).toBe(true);
        });

        it('should add resolvers for different namespaces', () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();

            Resolvers.add('namespace-1', mockFn1);
            Resolvers.add('namespace-2', mockFn2);

            expect(Resolvers.has('namespace-1')).toBe(true);
            expect(Resolvers.has('namespace-2')).toBe(true);
        });

        it('should handle namespaces with special characters', () => {
            const mockFn = vi.fn();
            Resolvers.add('user.profile.get', mockFn);

            expect(Resolvers.has('user.profile.get')).toBe(true);
        });

        it('should handle empty string namespace', () => {
            const mockFn = vi.fn();
            Resolvers.add('', mockFn);

            expect(Resolvers.has('')).toBe(true);
        });
    });

    describe('execute', () => {
        it('should execute the resolver for given namespace', async () => {
            const mockFn = vi.fn();

            Resolvers.add('test-namespace', mockFn);
            await Resolvers.execute('test-namespace');

            expect(mockFn).toHaveBeenCalled();
        });

        it('should pass arguments to resolver function', async () => {
            const mockFn = vi.fn();

            Resolvers.add('test-namespace', mockFn);
            await Resolvers.execute('test-namespace', 'arg1', 'arg2', {
                key: 'value',
            });

            expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', {
                key: 'value',
            });
        });

        it('should handle async resolver functions', async () => {
            const asyncFn = vi.fn(async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
                return 'result';
            });

            Resolvers.add('async-resolver', asyncFn);
            await Resolvers.execute('async-resolver');

            expect(asyncFn).toHaveBeenCalled();
        });

        it('should not throw when executing non-existent namespace', async () => {
            await expect(
                Resolvers.execute('non-existent'),
            ).resolves.not.toThrow();
        });

        it('should return undefined for non-existent namespace', async () => {
            const result = await Resolvers.execute('non-existent');
            expect(result).toBeUndefined();
        });

        it('should execute only the latest resolver when overwritten', async () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();

            Resolvers.add('test-namespace', mockFn1);
            Resolvers.add('test-namespace', mockFn2);
            await Resolvers.execute('test-namespace');

            expect(mockFn1).not.toHaveBeenCalled();
            expect(mockFn2).toHaveBeenCalled();
        });

        it('should execute resolvers for different namespaces independently', async () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();

            Resolvers.add('namespace-1', mockFn1);
            Resolvers.add('namespace-2', mockFn2);
            await Resolvers.execute('namespace-1');

            expect(mockFn1).toHaveBeenCalled();
            expect(mockFn2).not.toHaveBeenCalled();
        });

        it('should handle empty arguments', async () => {
            const mockFn = vi.fn();

            Resolvers.add('test-namespace', mockFn);
            await Resolvers.execute('test-namespace');

            expect(mockFn).toHaveBeenCalledWith();
        });

        it('should handle multiple arguments of different types', async () => {
            const mockFn = vi.fn();

            Resolvers.add('test-namespace', mockFn);
            await Resolvers.execute(
                'test-namespace',
                'string',
                123,
                true,
                null,
                undefined,
                { obj: 'value' },
                ['array'],
            );

            expect(mockFn).toHaveBeenCalledWith(
                'string',
                123,
                true,
                null,
                undefined,
                { obj: 'value' },
                ['array'],
            );
        });
    });

    describe('has', () => {
        it('should return true if namespace has resolver', () => {
            const mockFn = vi.fn();
            Resolvers.add('test-namespace', mockFn);

            expect(Resolvers.has('test-namespace')).toBe(true);
        });

        it('should return false if namespace has no resolver', () => {
            expect(Resolvers.has('non-existent')).toBe(false);
        });

        it('should return false after clearing namespace', () => {
            const mockFn = vi.fn();
            Resolvers.add('test-namespace', mockFn);
            Resolvers.clear('test-namespace');

            expect(Resolvers.has('test-namespace')).toBe(false);
        });

        it('should return false after removing namespace', () => {
            const mockFn = vi.fn();
            Resolvers.add('test-namespace', mockFn);
            Resolvers.remove('test-namespace', mockFn);

            expect(Resolvers.has('test-namespace')).toBe(false);
        });
    });

    describe('clear', () => {
        it('should remove resolver for a specific namespace', () => {
            const mockFn = vi.fn();

            Resolvers.add('test-namespace', mockFn);
            Resolvers.clear('test-namespace');

            expect(Resolvers.has('test-namespace')).toBe(false);
        });

        it('should not affect other namespaces when clearing', () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();

            Resolvers.add('namespace-1', mockFn1);
            Resolvers.add('namespace-2', mockFn2);
            Resolvers.clear('namespace-1');

            expect(Resolvers.has('namespace-1')).toBe(false);
            expect(Resolvers.has('namespace-2')).toBe(true);
        });

        it('should not throw when clearing non-existent namespace', () => {
            expect(() => Resolvers.clear('non-existent')).not.toThrow();
        });
    });

    describe('remove', () => {
        it('should remove resolver for a specific namespace', () => {
            const mockFn = vi.fn();

            Resolvers.add('test-namespace', mockFn);
            const result = Resolvers.remove('test-namespace', mockFn);

            expect(result).toBe(true);
            expect(Resolvers.has('test-namespace')).toBe(false);
        });

        it('should return false when removing non-existent namespace', () => {
            const mockFn = vi.fn();

            const result = Resolvers.remove('non-existent', mockFn);

            expect(result).toBe(false);
        });

        it('should not affect other namespaces when removing', () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();

            Resolvers.add('namespace-1', mockFn1);
            Resolvers.add('namespace-2', mockFn2);
            Resolvers.remove('namespace-1', mockFn1);

            expect(Resolvers.has('namespace-1')).toBe(false);
            expect(Resolvers.has('namespace-2')).toBe(true);
        });
    });

    describe('singleton behavior', () => {
        it('should use the same instance across multiple calls', () => {
            const mockFn = vi.fn();

            Resolvers.add('test-namespace', mockFn);

            expect(Resolvers.has('test-namespace')).toBe(true);
        });

        it('should persist resolvers across multiple operations', async () => {
            const mockFn = vi.fn();

            Resolvers.add('test-namespace', mockFn);
            await Resolvers.execute('test-namespace');
            await Resolvers.execute('test-namespace');

            expect(mockFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('edge cases', () => {
        it('should handle resolver that throws synchronously', async () => {
            const errorFn = vi.fn(() => {
                throw new Error('Resolver error');
            });

            Resolvers.add('error-resolver', errorFn);

            await expect(Resolvers.execute('error-resolver')).rejects.toThrow(
                'Resolver error',
            );
        });

        it('should handle resolver that rejects', async () => {
            const rejectFn = vi.fn(async () => {
                throw new Error('Async resolver error');
            });

            Resolvers.add('reject-resolver', rejectFn);

            await expect(Resolvers.execute('reject-resolver')).rejects.toThrow(
                'Async resolver error',
            );
        });

        it('should handle resolver returning a value', async () => {
            const returnFn = vi.fn(async () => 'return value');

            Resolvers.add('return-resolver', returnFn);
            await Resolvers.execute('return-resolver');

            expect(returnFn).toHaveBeenCalled();
        });

        it('should handle deeply nested namespace', () => {
            const mockFn = vi.fn();
            Resolvers.add('level1.level2.level3.level4.level5', mockFn);

            expect(Resolvers.has('level1.level2.level3.level4.level5')).toBe(
                true,
            );
        });

        it('should handle namespace with unicode characters', () => {
            const mockFn = vi.fn();
            Resolvers.add('测试名称空间', mockFn);

            expect(Resolvers.has('测试名称空间')).toBe(true);
        });
    });
});
