import { vi } from 'vitest';

export class MockScope {
    public static dataMap: Map<string, any> = new Map();

    public static set = vi
        .fn()
        .mockImplementation((name: string, data: any) => {
            MockScope.dataMap.set(name, data);
            return true;
        });

    public static has = vi.fn().mockImplementation((name: string) => {
        return MockScope.dataMap.has(name);
    });

    public static get = vi
        .fn()
        .mockImplementation(<T = any>(name: string): T | null => {
            return MockScope.dataMap.has(name)
                ? (MockScope.dataMap.get(name) as T)
                : null;
        });

    public static clear = vi.fn().mockImplementation((name: string) => {
        MockScope.dataMap.delete(name);
    });

    public static addToArray = vi
        .fn()
        .mockImplementation(<T = any>(name: string, value: T): boolean => {
            const array = MockScope.dataMap.get(name) || [];
            if (Array.isArray(array)) {
                array.push(value);
                MockScope.dataMap.set(name, array);
                return true;
            }
            return false;
        });

    public static removeFromArray = vi
        .fn()
        .mockImplementation(<T = any>(name: string, value: T): boolean => {
            const array = MockScope.dataMap.get(name);
            if (Array.isArray(array)) {
                const index = array.indexOf(value);
                if (index > -1) {
                    array.splice(index, 1);
                    MockScope.dataMap.set(name, array);
                    return true;
                }
            }
            return false;
        });

    public static getArray = vi
        .fn()
        .mockImplementation(<T = any>(name: string): T[] | null => {
            const array = MockScope.dataMap.get(name);
            if (Array.isArray(array)) return array as T[];
            return null;
        });

    public static getArrayFromIndex = vi
        .fn()
        .mockImplementation(
            <T = any>(name: string, index: number): T | null => {
                const array = MockScope.dataMap.get(name);
                if (Array.isArray(array) && array.length > index)
                    return array[index] as T;
                return null;
            },
        );

    public static reset(): void {
        MockScope.dataMap.clear();
        MockScope.set.mockReset();
        MockScope.has.mockReset();
        MockScope.get.mockReset();
        MockScope.clear.mockReset();
        MockScope.addToArray.mockReset();
        MockScope.removeFromArray.mockReset();
        MockScope.getArray.mockReset();
        MockScope.getArrayFromIndex.mockReset();

        MockScope.set.mockImplementation((name: string, data: any) => {
            MockScope.dataMap.set(name, data);
            return true;
        });

        MockScope.has.mockImplementation((name: string) => {
            return MockScope.dataMap.has(name);
        });

        MockScope.get.mockImplementation(<T = any>(name: string): T | null => {
            return MockScope.dataMap.has(name)
                ? (MockScope.dataMap.get(name) as T)
                : null;
        });

        MockScope.clear.mockImplementation((name: string) => {
            MockScope.dataMap.delete(name);
        });

        MockScope.addToArray.mockImplementation(
            <T = any>(name: string, value: T): boolean => {
                const array = MockScope.dataMap.get(name) || [];
                if (Array.isArray(array)) {
                    array.push(value);
                    MockScope.dataMap.set(name, array);
                    return true;
                }
                return false;
            },
        );

        MockScope.removeFromArray.mockImplementation(
            <T = any>(name: string, value: T): boolean => {
                const array = MockScope.dataMap.get(name);
                if (Array.isArray(array)) {
                    const index = array.indexOf(value);
                    if (index > -1) {
                        array.splice(index, 1);
                        MockScope.dataMap.set(name, array);
                        return true;
                    }
                }
                return false;
            },
        );

        MockScope.getArray.mockImplementation(
            <T = any>(name: string): T[] | null => {
                const array = MockScope.dataMap.get(name);
                if (Array.isArray(array)) return array as T[];
                return null;
            },
        );

        MockScope.getArrayFromIndex.mockImplementation(
            <T = any>(name: string, index: number): T | null => {
                const array = MockScope.dataMap.get(name);
                if (Array.isArray(array) && array.length > index)
                    return array[index] as T;
                return null;
            },
        );
    }

    public static getMockModule() {
        return {
            Scope: MockScope,
        };
    }
}

/**
 * Setup for mocking the Scope module
 *
 * @example
 * ```ts
 * import { mockScope } from '@cmmv/testing';
 *
 * vi.mock('@cmmv/core/lib/scope', () => mockScope.getMockModule());
 *
 * describe('Seu teste', () => {
 *   beforeEach(() => {
 *     mockScope.reset();
 *   });
 *
 *   it('testa o scope', () => {
 *     mockScope.set('test', 'value');
 *     expect(mockScope.get('test')).toEqual('value');
 *     expect(mockScope.set).toHaveBeenCalledWith('test', 'value');
 *   });
 * });
 * ```
 */
export const mockScope = MockScope;
