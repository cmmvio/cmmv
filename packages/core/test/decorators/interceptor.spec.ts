import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'reflect-metadata';

// Mock Application
vi.mock('../../application', () => ({
    Application: {
        setHTTPInterceptor: vi.fn(),
    },
}));

import { Interceptor } from '../../decorators/interceptor.decorator';
import { Application } from '../../application';

describe('Interceptor Decorator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('basic functionality', () => {
        it('should call Application.setHTTPInterceptor with the method', () => {
            class TestController {
                @Interceptor()
                async handleRequest(id: string, context: any) {
                    return true;
                }
            }

            expect(Application.setHTTPInterceptor).toHaveBeenCalled();
        });

        it('should pass the original method to setHTTPInterceptor', () => {
            class TestController {
                @Interceptor()
                handleRequest(id: string, context: any) {
                    return { intercepted: true };
                }
            }

            expect(Application.setHTTPInterceptor).toHaveBeenCalledWith(
                expect.any(Function),
            );
        });

        it('should work with async methods', () => {
            class TestController {
                @Interceptor()
                async asyncHandler(id: string, context: any) {
                    await new Promise((r) => setTimeout(r, 10));
                    return true;
                }
            }

            expect(Application.setHTTPInterceptor).toHaveBeenCalled();
        });

        it('should work with sync methods', () => {
            class TestController {
                @Interceptor()
                syncHandler(id: string, context: any) {
                    return false;
                }
            }

            expect(Application.setHTTPInterceptor).toHaveBeenCalled();
        });
    });

    describe('multiple interceptors', () => {
        it('should register multiple interceptors from different methods', () => {
            class TestController {
                @Interceptor()
                handler1() {
                    return 'handler1';
                }

                @Interceptor()
                handler2() {
                    return 'handler2';
                }
            }

            expect(Application.setHTTPInterceptor).toHaveBeenCalledTimes(2);
        });

        it('should register interceptors from different classes', () => {
            class Controller1 {
                @Interceptor()
                handler() {
                    return 'controller1';
                }
            }

            class Controller2 {
                @Interceptor()
                handler() {
                    return 'controller2';
                }
            }

            expect(Application.setHTTPInterceptor).toHaveBeenCalledTimes(2);
        });
    });

    describe('method preservation', () => {
        it('should preserve the original method functionality', () => {
            let capturedMethod: any;
            vi.mocked(Application.setHTTPInterceptor).mockImplementation(
                (fn) => {
                    capturedMethod = fn;
                },
            );

            class TestController {
                @Interceptor()
                handler(id: string) {
                    return `processed-${id}`;
                }
            }

            expect(capturedMethod).toBeDefined();
        });

        it('should work with methods that have parameters', () => {
            class TestController {
                @Interceptor()
                handler(id: string, context: any, options?: object) {
                    return { id, context, options };
                }
            }

            expect(Application.setHTTPInterceptor).toHaveBeenCalled();
        });

        it('should work with methods returning promises', () => {
            class TestController {
                @Interceptor()
                async handler(): Promise<boolean> {
                    return Promise.resolve(true);
                }
            }

            expect(Application.setHTTPInterceptor).toHaveBeenCalled();
        });
    });

    describe('decorator factory', () => {
        it('should return a method decorator function', () => {
            const decorator = Interceptor();

            expect(typeof decorator).toBe('function');
        });

        it('should be usable as decorator factory without arguments', () => {
            expect(() => {
                class TestController {
                    @Interceptor()
                    handler() {}
                }
            }).not.toThrow();
        });
    });

    describe('edge cases', () => {
        it('should handle empty method body', () => {
            class TestController {
                @Interceptor()
                emptyHandler() {}
            }

            expect(Application.setHTTPInterceptor).toHaveBeenCalled();
        });

        it('should handle method that throws', () => {
            class TestController {
                @Interceptor()
                throwingHandler() {
                    throw new Error('Test error');
                }
            }

            expect(Application.setHTTPInterceptor).toHaveBeenCalled();
        });

        it('should handle method with complex return type', () => {
            class TestController {
                @Interceptor()
                complexHandler() {
                    return {
                        data: [1, 2, 3],
                        nested: { a: { b: { c: 'd' } } },
                        fn: () => 'test',
                    };
                }
            }

            expect(Application.setHTTPInterceptor).toHaveBeenCalled();
        });
    });
});
