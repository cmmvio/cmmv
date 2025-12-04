import { describe, it, expect } from 'vitest';
import { getValueFromKey } from '../../lib/view.utils';

describe('getValueFromKey', () => {
    describe('basic functionality', () => {
        it('should return value for simple key', () => {
            const data = { name: 'test' };
            const result = getValueFromKey(data, 'name');

            expect(result).toBe('test');
        });

        it('should return nested value with dot notation', () => {
            const data = {
                user: {
                    profile: {
                        name: 'John',
                    },
                },
            };
            const result = getValueFromKey(data, 'user.profile.name');

            expect(result).toBe('John');
        });

        it('should return undefined for non-existent key', () => {
            const data = { name: 'test' };
            const result = getValueFromKey(data, 'missing');

            expect(result).toBeUndefined();
        });

        it('should return undefined for non-existent nested key', () => {
            const data = { user: { name: 'test' } };
            const result = getValueFromKey(data, 'user.profile.name');

            expect(result).toBeUndefined();
        });
    });

    describe('various data types', () => {
        it('should return number values', () => {
            const data = { count: 42 };
            const result = getValueFromKey(data, 'count');

            expect(result).toBe(42);
        });

        it('should return boolean values', () => {
            const data = { active: true };
            const result = getValueFromKey(data, 'active');

            expect(result).toBe(true);
        });

        it('should return null values', () => {
            const data = { value: null };
            const result = getValueFromKey(data, 'value');

            expect(result).toBeNull();
        });

        it('should return array values', () => {
            const data = { items: [1, 2, 3] };
            const result = getValueFromKey(data, 'items');

            expect(result).toEqual([1, 2, 3]);
        });

        it('should return object values', () => {
            const data = { config: { a: 1, b: 2 } };
            const result = getValueFromKey(data, 'config');

            expect(result).toEqual({ a: 1, b: 2 });
        });

        it('should return empty string', () => {
            const data = { name: '' };
            const result = getValueFromKey(data, 'name');

            expect(result).toBe('');
        });

        it('should return zero', () => {
            const data = { count: 0 };
            const result = getValueFromKey(data, 'count');

            expect(result).toBe(0);
        });

        it('should return false boolean', () => {
            const data = { active: false };
            const result = getValueFromKey(data, 'active');

            expect(result).toBe(false);
        });
    });

    describe('deeply nested objects', () => {
        it('should access deeply nested values', () => {
            const data = {
                level1: {
                    level2: {
                        level3: {
                            level4: {
                                value: 'deep',
                            },
                        },
                    },
                },
            };
            const result = getValueFromKey(
                data,
                'level1.level2.level3.level4.value',
            );

            expect(result).toBe('deep');
        });

        it('should return intermediate object', () => {
            const data = {
                user: {
                    profile: {
                        name: 'John',
                        age: 30,
                    },
                },
            };
            const result = getValueFromKey(data, 'user.profile');

            expect(result).toEqual({ name: 'John', age: 30 });
        });
    });

    describe('edge cases', () => {
        it('should handle empty object', () => {
            const data = {};
            const result = getValueFromKey(data, 'key');

            expect(result).toBeUndefined();
        });

        it('should handle empty key', () => {
            const data = { '': 'empty key value' };
            const result = getValueFromKey(data, '');

            expect(result).toBe('empty key value');
        });

        it('should handle keys with special characters in value', () => {
            const data = { message: 'Hello, World!' };
            const result = getValueFromKey(data, 'message');

            expect(result).toBe('Hello, World!');
        });

        it('should stop traversal when encountering undefined', () => {
            const data = { a: undefined };
            const result = getValueFromKey(data, 'a.b.c');

            expect(result).toBeUndefined();
        });

        it('should handle array access by index via dot notation', () => {
            const data = { items: ['a', 'b', 'c'] };
            const result = getValueFromKey(data, 'items.1');

            expect(result).toBe('b');
        });

        it('should handle mixed object and array access', () => {
            const data = {
                users: [{ name: 'Alice' }, { name: 'Bob' }],
            };
            const result = getValueFromKey(data, 'users.0.name');

            expect(result).toBe('Alice');
        });
    });

    describe('falsy values handling', () => {
        it('should correctly return 0 and not stop traversal', () => {
            const data = { count: 0 };
            const result = getValueFromKey(data, 'count');

            expect(result).toBe(0);
        });

        it('should correctly return empty string', () => {
            const data = { name: '' };
            const result = getValueFromKey(data, 'name');

            expect(result).toBe('');
        });

        it('should return null when traversing through null value', () => {
            const data = { value: null };
            const result = getValueFromKey(data, 'value.nested');

            // The reduce returns null because null && null['nested'] = null
            expect(result).toBeNull();
        });
    });
});
