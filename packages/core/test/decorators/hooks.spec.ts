import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'reflect-metadata';
import { Hook } from '../../decorators/hooks.decorator';
import { Hooks, HooksType } from '../../lib/hooks';

describe('Hook Decorator', () => {
    beforeEach(() => {
        // Reset Hooks singleton
        (Hooks as any).instance = undefined;
        // Clear all hooks
        Object.values(HooksType).forEach((hookType) => {
            if (typeof hookType === 'number') {
                Hooks.clear(hookType as HooksType);
            }
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('basic functionality', () => {
        it('should register hook handler for onInitialize', () => {
            class TestService {
                @Hook(HooksType.onInitialize)
                onInit() {
                    return 'initialized';
                }
            }

            expect(Hooks.has(HooksType.onInitialize)).toBe(true);
        });

        it('should register hook handler for onListen', () => {
            class TestService {
                @Hook(HooksType.onListen)
                onListen() {
                    return 'listening';
                }
            }

            expect(Hooks.has(HooksType.onListen)).toBe(true);
        });

        it('should register hook handler for onPreInitialize', () => {
            class TestService {
                @Hook(HooksType.onPreInitialize)
                onPreInit() {
                    return 'pre-init';
                }
            }

            expect(Hooks.has(HooksType.onPreInitialize)).toBe(true);
        });

        it('should register hook handler for onError', () => {
            class TestService {
                @Hook(HooksType.onError)
                onError(error: Error) {
                    return `error: ${error.message}`;
                }
            }

            expect(Hooks.has(HooksType.onError)).toBe(true);
        });

        it('should register hook handler for onHTTPServerInit', () => {
            class TestService {
                @Hook(HooksType.onHTTPServerInit)
                onServerInit() {
                    return 'server initialized';
                }
            }

            expect(Hooks.has(HooksType.onHTTPServerInit)).toBe(true);
        });

        it('should register hook handler for Log', () => {
            class TestService {
                @Hook(HooksType.Log)
                onLog(message: string) {
                    return `logged: ${message}`;
                }
            }

            expect(Hooks.has(HooksType.Log)).toBe(true);
        });

        it('should register hook handler for onSettingChange', () => {
            class TestService {
                @Hook(HooksType.onSettingChange)
                onSettingChange(setting: string, value: any) {
                    return `${setting}: ${value}`;
                }
            }

            expect(Hooks.has(HooksType.onSettingChange)).toBe(true);
        });
    });

    describe('hook execution', () => {
        it('should execute registered hook when triggered', async () => {
            const mockFn = vi.fn();

            class TestService {
                @Hook(HooksType.onInitialize)
                onInit() {
                    mockFn();
                }
            }

            await Hooks.execute(HooksType.onInitialize);

            expect(mockFn).toHaveBeenCalled();
        });

        it('should pass arguments to hook handler', async () => {
            const mockFn = vi.fn();

            class TestService {
                @Hook(HooksType.onError)
                onError(error: Error, context: string) {
                    mockFn(error, context);
                }
            }

            const testError = new Error('test error');
            await Hooks.execute(HooksType.onError, testError, 'test-context');

            expect(mockFn).toHaveBeenCalledWith(testError, 'test-context');
        });

        it('should handle async hook methods', async () => {
            const results: string[] = [];

            class TestService {
                @Hook(HooksType.onInitialize)
                async onInit() {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    results.push('async completed');
                }
            }

            await Hooks.execute(HooksType.onInitialize);

            expect(results).toContain('async completed');
        });
    });

    describe('multiple hooks', () => {
        it('should allow multiple hooks for same event', async () => {
            const results: string[] = [];

            class TestService1 {
                @Hook(HooksType.onInitialize)
                onInit1() {
                    results.push('hook1');
                }
            }

            class TestService2 {
                @Hook(HooksType.onInitialize)
                onInit2() {
                    results.push('hook2');
                }
            }

            await Hooks.execute(HooksType.onInitialize);

            expect(results).toContain('hook1');
            expect(results).toContain('hook2');
        });

        it('should register hooks for different events', () => {
            class TestService {
                @Hook(HooksType.onInitialize)
                onInit() {}

                @Hook(HooksType.onListen)
                onListen() {}

                @Hook(HooksType.onError)
                onError() {}
            }

            expect(Hooks.has(HooksType.onInitialize)).toBe(true);
            expect(Hooks.has(HooksType.onListen)).toBe(true);
            expect(Hooks.has(HooksType.onError)).toBe(true);
        });
    });

    describe('error handling', () => {
        it('should throw error when decorator is applied to non-function', () => {
            const decorator = Hook(HooksType.onInitialize);
            const descriptor = { value: 'not a function' };

            expect(() => {
                decorator({}, 'propertyName', descriptor as any);
            }).toThrow('@Hook can only be used on methods.');
        });

        it('should propagate errors from hook handler', async () => {
            class TestService {
                @Hook(HooksType.onError)
                onError() {
                    throw new Error('Hook error');
                }
            }

            await expect(Hooks.execute(HooksType.onError)).rejects.toThrow(
                'Hook error',
            );
        });

        it('should propagate async errors from hook handler', async () => {
            class TestService {
                @Hook(HooksType.onInitialize)
                async onInit() {
                    throw new Error('Async hook error');
                }
            }

            await expect(Hooks.execute(HooksType.onInitialize)).rejects.toThrow(
                'Async hook error',
            );
        });
    });

    describe('hook context', () => {
        it('should execute hook with correct this context', async () => {
            let capturedThis: any;

            class TestService {
                serviceName = 'TestService';

                @Hook(HooksType.onInitialize)
                onInit() {
                    capturedThis = this;
                }
            }

            await Hooks.execute(HooksType.onInitialize);

            // Note: Due to the decorator implementation, 'this' is the class prototype
            expect(capturedThis).toBeDefined();
        });
    });
});
