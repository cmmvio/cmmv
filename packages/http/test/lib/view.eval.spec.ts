import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    evaluate,
    evaluateAsync,
    execute,
    toFunction,
} from '../../lib/view.eval';

describe('view.eval', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('toFunction', () => {
        it('should create a function from expression', () => {
            const fn = toFunction('return(1 + 1)');

            expect(typeof fn).toBe('function');
        });

        it('should return a callable function', () => {
            const fn = toFunction('return(x)');
            const result = fn({ x: 42 });

            expect(result).toBe(42);
        });

        it('should handle complex expressions', () => {
            const fn = toFunction('return(a + b * c)');
            const result = fn({ a: 1, b: 2, c: 3 });

            expect(result).toBe(7);
        });

        it('should handle invalid expressions gracefully', () => {
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const fn = toFunction('return(invalid syntax @@@@)');

            expect(typeof fn).toBe('function');
            // The returned function should be callable
            expect(() => fn({})).not.toThrow();

            consoleSpy.mockRestore();
        });

        it('should access scope properties', () => {
            const fn = toFunction('return(user.name)');
            const result = fn({ user: { name: 'John' } });

            expect(result).toBe('John');
        });
    });

    describe('execute', () => {
        it('should execute simple expression', () => {
            const result = execute({ x: 5 }, 'return(x)');

            expect(result).toBe(5);
        });

        it('should execute mathematical expression', () => {
            const result = execute({ a: 10, b: 20 }, 'return(a + b)');

            expect(result).toBe(30);
        });

        it('should access nested properties', () => {
            const scope = {
                user: {
                    profile: {
                        name: 'Alice',
                    },
                },
            };
            const result = execute(scope, 'return(user.profile.name)');

            expect(result).toBe('Alice');
        });

        it('should handle array access', () => {
            const scope = { items: [1, 2, 3] };
            const result = execute(scope, 'return(items[1])');

            expect(result).toBe(2);
        });

        it('should handle function calls', () => {
            const scope = {
                greet: (name: string) => `Hello, ${name}!`,
            };
            const result = execute(scope, 'return(greet("World"))');

            expect(result).toBe('Hello, World!');
        });

        it('should cache compiled functions', () => {
            const scope = { x: 1 };
            const exp = 'return(x * 2)';

            execute(scope, exp);
            const result = execute({ x: 5 }, exp);

            // Same expression should use cached function
            expect(result).toBe(10);
        });

        it('should handle undefined gracefully', () => {
            const result = execute({}, 'return(undefined)');

            expect(result).toBeUndefined();
        });

        it('should handle null values', () => {
            const result = execute({ value: null }, 'return(value)');

            expect(result).toBeNull();
        });

        it('should handle boolean expressions', () => {
            const result = execute({ a: 5, b: 3 }, 'return(a > b)');

            expect(result).toBe(true);
        });

        it('should handle ternary expressions', () => {
            const result = execute(
                { condition: true },
                'return(condition ? "yes" : "no")',
            );

            expect(result).toBe('yes');
        });

        it('should handle errors silently', () => {
            // Accessing undefined property on null should not throw
            const result = execute({ obj: null }, 'return(obj.property)');

            expect(result).toBeUndefined();
        });
    });

    describe('evaluate', () => {
        it('should evaluate simple expression', () => {
            const result = evaluate({ x: 42 }, 'x');

            expect(result).toBe(42);
        });

        it('should evaluate mathematical expression', () => {
            const result = evaluate({ a: 3, b: 4 }, 'a * b');

            expect(result).toBe(12);
        });

        it('should evaluate string concatenation', () => {
            const result = evaluate(
                { firstName: 'John', lastName: 'Doe' },
                'firstName + " " + lastName',
            );

            expect(result).toBe('John Doe');
        });

        it('should evaluate comparison expressions', () => {
            const result = evaluate({ value: 10 }, 'value >= 10');

            expect(result).toBe(true);
        });

        it('should evaluate logical expressions', () => {
            const result = evaluate({ a: true, b: false }, 'a && !b');

            expect(result).toBe(true);
        });

        it('should evaluate array methods', () => {
            const result = evaluate(
                { numbers: [1, 2, 3, 4, 5] },
                'numbers.filter(n => n > 2).length',
            );

            expect(result).toBe(3);
        });

        it('should evaluate object literals', () => {
            const result = evaluate({ name: 'test' }, '({ key: name })');

            expect(result).toEqual({ key: 'test' });
        });

        it('should evaluate template literals', () => {
            const result = evaluate({ name: 'World' }, '`Hello, ${name}!`');

            expect(result).toBe('Hello, World!');
        });

        it('should handle Date operations', () => {
            const now = new Date();
            const result = evaluate({ date: now }, 'date.getFullYear()');

            expect(result).toBe(now.getFullYear());
        });

        it('should handle JSON operations', () => {
            const result = evaluate({}, 'JSON.stringify({ a: 1 })');

            expect(result).toBe('{"a":1}');
        });
    });

    describe('evaluateAsync', () => {
        it('should resolve with evaluated result', async () => {
            const result = await evaluateAsync({ x: 100 }, 'x');

            expect(result).toBe(100);
        });

        it('should resolve with mathematical result', async () => {
            const result = await evaluateAsync({ a: 5, b: 7 }, 'a + b');

            expect(result).toBe(12);
        });

        it('should resolve with complex expression result', async () => {
            const result = await evaluateAsync(
                { items: [{ value: 1 }, { value: 2 }, { value: 3 }] },
                'items.map(i => i.value).reduce((a, b) => a + b, 0)',
            );

            expect(result).toBe(6);
        });

        it('should resolve undefined for error expressions (execute catches errors)', async () => {
            // The execute function catches errors silently and returns undefined
            // So evaluateAsync will resolve with undefined, not reject
            const result = await evaluateAsync({}, 'undefinedFunction()');

            expect(result).toBeUndefined();
        });

        it('should handle async-like expressions', async () => {
            const result = await evaluateAsync(
                { getValue: () => 42 },
                'getValue()',
            );

            expect(result).toBe(42);
        });

        it('should handle null scope values', async () => {
            const result = await evaluateAsync({ value: null }, 'value');

            expect(result).toBeNull();
        });

        it('should handle boolean results', async () => {
            const result = await evaluateAsync({ a: 5, b: 5 }, 'a === b');

            expect(result).toBe(true);
        });
    });

    describe('scope access', () => {
        it('should access top-level properties', () => {
            const result = evaluate({ name: 'test' }, 'name');

            expect(result).toBe('test');
        });

        it('should access deeply nested properties', () => {
            const scope = {
                level1: {
                    level2: {
                        level3: {
                            value: 'deep',
                        },
                    },
                },
            };
            const result = evaluate(scope, 'level1.level2.level3.value');

            expect(result).toBe('deep');
        });

        it('should handle arrays in scope', () => {
            const scope = {
                users: [
                    { name: 'Alice', age: 30 },
                    { name: 'Bob', age: 25 },
                ],
            };
            const result = evaluate(scope, 'users[0].name');

            expect(result).toBe('Alice');
        });

        it('should handle Map-like operations', () => {
            const scope = {
                data: new Map([
                    ['key1', 'value1'],
                    ['key2', 'value2'],
                ]),
            };
            const result = evaluate(scope, 'data.get("key1")');

            expect(result).toBe('value1');
        });

        it('should handle Set operations', () => {
            const scope = {
                mySet: new Set([1, 2, 3]),
            };
            const result = evaluate(scope, 'mySet.has(2)');

            expect(result).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle empty scope', () => {
            const result = evaluate({}, 'undefined');

            expect(result).toBeUndefined();
        });

        it('should handle special characters in strings', () => {
            const result = evaluate({}, '"Hello\\nWorld"');

            expect(result).toBe('Hello\nWorld');
        });

        it('should handle regex', () => {
            const result = evaluate({ str: 'hello123' }, '/\\d+/.test(str)');

            expect(result).toBe(true);
        });

        it('should handle typeof operator', () => {
            const result = evaluate({ value: 42 }, 'typeof value');

            expect(result).toBe('number');
        });

        it('should handle instanceof operator', () => {
            const result = evaluate({ arr: [] }, 'arr instanceof Array');

            expect(result).toBe(true);
        });

        it('should handle spread operator', () => {
            const result = evaluate({ arr: [1, 2, 3] }, '[...arr, 4, 5]');

            expect(result).toEqual([1, 2, 3, 4, 5]);
        });

        it('should handle destructuring in expression', () => {
            const result = evaluate(
                { obj: { a: 1, b: 2 } },
                '(({a, b}) => a + b)(obj)',
            );

            expect(result).toBe(3);
        });

        it('should handle optional chaining', () => {
            const result = evaluate({ obj: null }, 'obj?.property');

            expect(result).toBeUndefined();
        });

        it('should handle nullish coalescing', () => {
            const result = evaluate({ value: null }, 'value ?? "default"');

            expect(result).toBe('default');
        });
    });

    describe('built-in objects', () => {
        it('should access Math object', () => {
            const result = evaluate({}, 'Math.max(1, 2, 3)');

            expect(result).toBe(3);
        });

        it('should access Math.PI', () => {
            const result = evaluate({}, 'Math.PI');

            expect(result).toBe(Math.PI);
        });

        it('should access Number methods', () => {
            const result = evaluate({}, 'Number.isInteger(42)');

            expect(result).toBe(true);
        });

        it('should access String methods', () => {
            const result = evaluate({}, '"hello".toUpperCase()');

            expect(result).toBe('HELLO');
        });

        it('should access Array methods', () => {
            const result = evaluate({}, 'Array.isArray([1,2,3])');

            expect(result).toBe(true);
        });

        it('should access Object methods', () => {
            const result = evaluate(
                { obj: { a: 1, b: 2 } },
                'Object.keys(obj)',
            );

            expect(result).toEqual(['a', 'b']);
        });
    });
});
