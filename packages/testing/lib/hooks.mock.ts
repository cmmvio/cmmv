import { vi } from 'vitest';

export enum MockHooksType {
    'onPreInitialize' = 'onPreInitialize',
    'onInitialize' = 'onInitialize',
    'onListen' = 'onListen',
    'onError' = 'onError',
    'onHTTPServerInit' = 'onHTTPServerInit',
    'Log' = 'Log',
    'onSettingChange' = 'onSettingChange',
}

export class MockHooks {
    public static events: Map<string, Array<Function>> = new Map();

    public static add = vi
        .fn()
        .mockImplementation((event: string, fn: Function): void => {
            if (!MockHooks.events.has(event)) {
                MockHooks.events.set(event, []);
            }
            MockHooks.events.get(event)?.push(fn);
        });

    public static execute = vi
        .fn()
        .mockImplementation(
            async (event: string, ...args: any[]): Promise<void> => {
                const hooks = MockHooks.events.get(event) || [];
                for (const fn of hooks) {
                    await fn(...args);
                }
            },
        );

    public static has = vi.fn().mockImplementation((event: string): boolean => {
        return MockHooks.events.has(event);
    });

    public static clear = vi.fn().mockImplementation((event: string): void => {
        MockHooks.events.delete(event);
    });

    public static remove = vi
        .fn()
        .mockImplementation((event: string, fn: Function): boolean => {
            const hooks = MockHooks.events.get(event);
            if (hooks) {
                const index = hooks.indexOf(fn);
                if (index > -1) {
                    hooks.splice(index, 1);
                    MockHooks.events.set(event, hooks);
                    return true;
                }
            }
            return false;
        });

    /**
     * Resets all mocks and clears all stored hooks
     */
    public static reset(): void {
        MockHooks.events.clear();
        MockHooks.add.mockReset();
        MockHooks.execute.mockReset();
        MockHooks.has.mockReset();
        MockHooks.clear.mockReset();
        MockHooks.remove.mockReset();

        // Restore implementations
        MockHooks.add.mockImplementation(
            (event: string, fn: Function): void => {
                if (!MockHooks.events.has(event)) {
                    MockHooks.events.set(event, []);
                }
                MockHooks.events.get(event)?.push(fn);
            },
        );

        MockHooks.execute.mockImplementation(
            async (event: string, ...args: any[]): Promise<void> => {
                const hooks = MockHooks.events.get(event) || [];
                for (const fn of hooks) {
                    await fn(...args);
                }
            },
        );

        MockHooks.has.mockImplementation((event: string): boolean => {
            return MockHooks.events.has(event);
        });

        MockHooks.clear.mockImplementation((event: string): void => {
            MockHooks.events.delete(event);
        });

        MockHooks.remove.mockImplementation(
            (event: string, fn: Function): boolean => {
                const hooks = MockHooks.events.get(event);
                if (hooks) {
                    const index = hooks.indexOf(fn);
                    if (index > -1) {
                        hooks.splice(index, 1);
                        MockHooks.events.set(event, hooks);
                        return true;
                    }
                }
                return false;
            },
        );
    }

    /**
     * Returns mock module structure
     */
    public static getMockModule() {
        return {
            Hooks: MockHooks,
            HooksType: MockHooksType,
        };
    }
}

/**
 * Setup for mocking the Hooks module
 *
 * @example
 * ```ts
 * import { mockHooks, MockHooksType } from '@cmmv/testing';
 *
 * vi.mock('@cmmv/core/lib/hooks', () => mockHooks.getMockModule());
 *
 * describe('Your test', () => {
 *   beforeEach(() => {
 *     mockHooks.reset();
 *   });
 *
 *   it('tests hook functionality', () => {
 *     const hookFn = vi.fn();
 *     mockHooks.add(MockHooksType.Log, hookFn);
 *
 *     // Call the hook
 *     mockHooks.execute(MockHooksType.Log, { message: 'test' });
 *
 *     // Assert
 *     expect(hookFn).toHaveBeenCalledWith({ message: 'test' });
 *     expect(mockHooks.add).toHaveBeenCalledWith(MockHooksType.Log, hookFn);
 *   });
 * });
 * ```
 */
export const mockHooks = MockHooks;
