import { vi } from 'vitest';

export class MockResolvers {
    public static resolvers: Map<
        string,
        (...args: any[]) => void | Promise<void>
    > = new Map();

    public static add = vi
        .fn()
        .mockImplementation(
            (
                namespace: string,
                fn: (...args: any[]) => void | Promise<void>,
            ): void => {
                MockResolvers.resolvers.set(namespace, fn);
            },
        );

    public static execute = vi
        .fn()
        .mockImplementation(
            async (namespace: string, ...args: any[]): Promise<void> => {
                const resolver = MockResolvers.resolvers.get(namespace) || null;
                if (resolver) return await resolver(...args);
            },
        );

    public static has = vi
        .fn()
        .mockImplementation((namespace: string): boolean => {
            return MockResolvers.resolvers.has(namespace);
        });

    public static clear = vi
        .fn()
        .mockImplementation((namespace: string): void => {
            MockResolvers.resolvers.delete(namespace);
        });

    public static remove = vi
        .fn()
        .mockImplementation((namespace: string): boolean => {
            return MockResolvers.resolvers.delete(namespace);
        });

    public static reset(): void {
        MockResolvers.resolvers.clear();
        MockResolvers.add.mockReset();
        MockResolvers.execute.mockReset();
        MockResolvers.has.mockReset();
        MockResolvers.clear.mockReset();
        MockResolvers.remove.mockReset();

        MockResolvers.add.mockImplementation(
            (
                namespace: string,
                fn: (...args: any[]) => void | Promise<void>,
            ): void => {
                MockResolvers.resolvers.set(namespace, fn);
            },
        );

        MockResolvers.execute.mockImplementation(
            async (namespace: string, ...args: any[]): Promise<void> => {
                const resolver = MockResolvers.resolvers.get(namespace) || null;
                if (resolver) return await resolver(...args);
            },
        );

        MockResolvers.has.mockImplementation((namespace: string): boolean => {
            return MockResolvers.resolvers.has(namespace);
        });

        MockResolvers.clear.mockImplementation((namespace: string): void => {
            MockResolvers.resolvers.delete(namespace);
        });

        MockResolvers.remove.mockImplementation(
            (namespace: string): boolean => {
                return MockResolvers.resolvers.delete(namespace);
            },
        );
    }

    public static getMockModule() {
        return {
            Resolvers: MockResolvers,
        };
    }
}

/**
 * Setup for mocking the Resolvers module
 *
 * @example
 * ```ts
 * import { mockResolvers } from '@cmmv/testing';
 *
 * vi.mock('@cmmv/core/lib/resolvers', () => mockResolvers.getMockModule());
 *
 * describe('Your test', () => {
 *   beforeEach(() => {
 *     mockResolvers.reset();
 *   });
 *
 *   it('tests resolvers functionality', () => {
 *     const resolver = vi.fn();
 *     mockResolvers.add('test.namespace', resolver);
 *
 *     // Call the resolver
 *     mockResolvers.execute('test.namespace', { data: 'test' });
 *
 *     // Assert
 *     expect(resolver).toHaveBeenCalledWith({ data: 'test' });
 *     expect(mockResolvers.add).toHaveBeenCalledWith('test.namespace', resolver);
 *   });
 * });
 * ```
 */
export const mockResolvers = MockResolvers;
