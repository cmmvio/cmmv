import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hooks, HooksType } from '../../lib/hooks';

describe('Hooks', () => {
    beforeEach(() => {
        // Reset singleton instance and clear all hooks
        (Hooks as any).instance = undefined;
        Object.values(HooksType).forEach((hookType) => {
            if (typeof hookType === 'number') {
                Hooks.clear(hookType as HooksType);
            }
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('HooksType enum', () => {
        it('should have onPreInitialize hook type', () => {
            expect(HooksType.onPreInitialize).toBeDefined();
        });

        it('should have onInitialize hook type', () => {
            expect(HooksType.onInitialize).toBeDefined();
        });

        it('should have onListen hook type', () => {
            expect(HooksType.onListen).toBeDefined();
        });

        it('should have onError hook type', () => {
            expect(HooksType.onError).toBeDefined();
        });

        it('should have onHTTPServerInit hook type', () => {
            expect(HooksType.onHTTPServerInit).toBeDefined();
        });

        it('should have Log hook type', () => {
            expect(HooksType.Log).toBeDefined();
        });

        it('should have onSettingChange hook type', () => {
            expect(HooksType.onSettingChange).toBeDefined();
        });
    });

    describe('add', () => {
        it('should add a hook function for a given event', () => {
            const mockFn = vi.fn();
            Hooks.add(HooksType.onInitialize, mockFn);

            expect(Hooks.has(HooksType.onInitialize)).toBe(true);
        });

        it('should add multiple hooks for the same event', () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();
            const mockFn3 = vi.fn();

            Hooks.add(HooksType.onInitialize, mockFn1);
            Hooks.add(HooksType.onInitialize, mockFn2);
            Hooks.add(HooksType.onInitialize, mockFn3);

            expect(Hooks.has(HooksType.onInitialize)).toBe(true);
        });

        it('should add hooks for different events', () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();

            Hooks.add(HooksType.onInitialize, mockFn1);
            Hooks.add(HooksType.onListen, mockFn2);

            expect(Hooks.has(HooksType.onInitialize)).toBe(true);
            expect(Hooks.has(HooksType.onListen)).toBe(true);
        });
    });

    describe('execute', () => {
        it('should execute all registered hooks for an event', async () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();

            Hooks.add(HooksType.onInitialize, mockFn1);
            Hooks.add(HooksType.onInitialize, mockFn2);

            await Hooks.execute(HooksType.onInitialize);

            expect(mockFn1).toHaveBeenCalled();
            expect(mockFn2).toHaveBeenCalled();
        });

        it('should execute hooks in order', async () => {
            const executionOrder: number[] = [];
            const mockFn1 = vi.fn(() => executionOrder.push(1));
            const mockFn2 = vi.fn(() => executionOrder.push(2));
            const mockFn3 = vi.fn(() => executionOrder.push(3));

            Hooks.add(HooksType.onInitialize, mockFn1);
            Hooks.add(HooksType.onInitialize, mockFn2);
            Hooks.add(HooksType.onInitialize, mockFn3);

            await Hooks.execute(HooksType.onInitialize);

            expect(executionOrder).toEqual([1, 2, 3]);
        });

        it('should pass arguments to hook functions', async () => {
            const mockFn = vi.fn();

            Hooks.add(HooksType.onError, mockFn);
            await Hooks.execute(
                HooksType.onError,
                'error message',
                { code: 500 },
            );

            expect(mockFn).toHaveBeenCalledWith('error message', { code: 500 });
        });

        it('should handle async hook functions', async () => {
            const results: string[] = [];
            const asyncFn1 = vi.fn(async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
                results.push('first');
            });
            const asyncFn2 = vi.fn(async () => {
                results.push('second');
            });

            Hooks.add(HooksType.onInitialize, asyncFn1);
            Hooks.add(HooksType.onInitialize, asyncFn2);

            await Hooks.execute(HooksType.onInitialize);

            expect(results).toEqual(['first', 'second']);
        });

        it('should not throw when executing non-existent event', async () => {
            await expect(
                Hooks.execute(HooksType.onPreInitialize),
            ).resolves.not.toThrow();
        });

        it('should execute hooks for different events independently', async () => {
            const initFn = vi.fn();
            const listenFn = vi.fn();

            Hooks.add(HooksType.onInitialize, initFn);
            Hooks.add(HooksType.onListen, listenFn);

            await Hooks.execute(HooksType.onInitialize);

            expect(initFn).toHaveBeenCalled();
            expect(listenFn).not.toHaveBeenCalled();
        });
    });

    describe('has', () => {
        it('should return true if event has registered hooks', () => {
            const mockFn = vi.fn();
            Hooks.add(HooksType.onInitialize, mockFn);

            expect(Hooks.has(HooksType.onInitialize)).toBe(true);
        });

        it('should return false if event has no registered hooks', () => {
            expect(Hooks.has(HooksType.onPreInitialize)).toBe(false);
        });

        it('should return false after clearing event hooks', () => {
            const mockFn = vi.fn();
            Hooks.add(HooksType.onInitialize, mockFn);
            Hooks.clear(HooksType.onInitialize);

            expect(Hooks.has(HooksType.onInitialize)).toBe(false);
        });
    });

    describe('clear', () => {
        it('should remove all hooks for a specific event', () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();

            Hooks.add(HooksType.onInitialize, mockFn1);
            Hooks.add(HooksType.onInitialize, mockFn2);

            Hooks.clear(HooksType.onInitialize);

            expect(Hooks.has(HooksType.onInitialize)).toBe(false);
        });

        it('should not affect other events when clearing', () => {
            const initFn = vi.fn();
            const listenFn = vi.fn();

            Hooks.add(HooksType.onInitialize, initFn);
            Hooks.add(HooksType.onListen, listenFn);

            Hooks.clear(HooksType.onInitialize);

            expect(Hooks.has(HooksType.onInitialize)).toBe(false);
            expect(Hooks.has(HooksType.onListen)).toBe(true);
        });

        it('should not throw when clearing non-existent event', () => {
            expect(() => Hooks.clear(HooksType.onPreInitialize)).not.toThrow();
        });
    });

    describe('remove', () => {
        it('should remove a specific hook function', () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();

            Hooks.add(HooksType.onInitialize, mockFn1);
            Hooks.add(HooksType.onInitialize, mockFn2);

            const result = Hooks.remove(HooksType.onInitialize, mockFn1);

            expect(result).toBe(true);
        });

        it('should return false when removing non-existent hook', () => {
            const mockFn = vi.fn();

            const result = Hooks.remove(HooksType.onInitialize, mockFn);

            expect(result).toBe(false);
        });

        it('should return false when event has no hooks', () => {
            const mockFn = vi.fn();

            const result = Hooks.remove(HooksType.onPreInitialize, mockFn);

            expect(result).toBe(false);
        });

        it('should only remove the specified hook', async () => {
            const mockFn1 = vi.fn();
            const mockFn2 = vi.fn();

            Hooks.add(HooksType.onInitialize, mockFn1);
            Hooks.add(HooksType.onInitialize, mockFn2);

            Hooks.remove(HooksType.onInitialize, mockFn1);
            await Hooks.execute(HooksType.onInitialize);

            expect(mockFn1).not.toHaveBeenCalled();
            expect(mockFn2).toHaveBeenCalled();
        });

        it('should keep event entry after removing last hook', () => {
            const mockFn = vi.fn();

            Hooks.add(HooksType.onInitialize, mockFn);
            Hooks.remove(HooksType.onInitialize, mockFn);

            // Event still exists but with empty array
            expect(Hooks.has(HooksType.onInitialize)).toBe(true);
        });
    });

    describe('singleton behavior', () => {
        it('should use the same instance across multiple calls', () => {
            const mockFn = vi.fn();

            Hooks.add(HooksType.onInitialize, mockFn);

            // Should be accessible from any static call
            expect(Hooks.has(HooksType.onInitialize)).toBe(true);
        });

        it('should persist hooks across multiple operations', async () => {
            const mockFn = vi.fn();

            Hooks.add(HooksType.onInitialize, mockFn);
            await Hooks.execute(HooksType.onInitialize);
            await Hooks.execute(HooksType.onInitialize);

            expect(mockFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('edge cases', () => {
        it('should handle hook that throws synchronously', async () => {
            const errorFn = vi.fn(() => {
                throw new Error('Hook error');
            });

            Hooks.add(HooksType.onError, errorFn);

            await expect(Hooks.execute(HooksType.onError)).rejects.toThrow(
                'Hook error',
            );
        });

        it('should handle hook that rejects', async () => {
            const rejectFn = vi.fn(async () => {
                throw new Error('Async hook error');
            });

            Hooks.add(HooksType.onError, rejectFn);

            await expect(Hooks.execute(HooksType.onError)).rejects.toThrow(
                'Async hook error',
            );
        });

        it('should handle empty arguments', async () => {
            const mockFn = vi.fn();

            Hooks.add(HooksType.onInitialize, mockFn);
            await Hooks.execute(HooksType.onInitialize);

            expect(mockFn).toHaveBeenCalledWith();
        });

        it('should handle multiple arguments', async () => {
            const mockFn = vi.fn();

            Hooks.add(HooksType.Log, mockFn);
            await Hooks.execute(HooksType.Log, 'arg1', 'arg2', 'arg3', {
                key: 'value',
            });

            expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3', {
                key: 'value',
            });
        });
    });
});
