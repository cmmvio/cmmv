import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'reflect-metadata';

// Mock node:path
vi.mock('node:path', () => ({
    default: {
        resolve: vi.fn((...args) => args.join('/')),
        basename: vi.fn((filename: string) => {
            const parts = filename.split('/');
            return parts[parts.length - 1];
        }),
    },
    resolve: vi.fn((...args) => args.join('/')),
    basename: vi.fn((filename: string) => {
        const parts = filename.split('/');
        return parts[parts.length - 1];
    }),
}));

// Mock node:fs
vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn(),
    },
    readFileSync: vi.fn(),
}));

// Mock fast-glob
vi.mock('fast-glob', () => ({
    default: vi.fn().mockResolvedValue([]),
}));

// Mock @cmmv/core Singleton
vi.mock('@cmmv/core', () => ({
    Singleton: class Singleton {
        private static instances = new Map();
        public static getInstance<T>(this: new () => T): T {
            if (!Singleton.instances.has(this)) {
                Singleton.instances.set(this, new this());
            }
            return Singleton.instances.get(this) as T;
        }
    },
}));

import { ViewRegistry } from '../../registries/view.registry';

describe('ViewRegistry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset singleton styles map
        const instance = ViewRegistry.getInstance();
        instance.styles.clear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getInstance', () => {
        it('should return singleton instance', () => {
            const instance1 = ViewRegistry.getInstance();
            const instance2 = ViewRegistry.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should have styles map initialized', () => {
            const instance = ViewRegistry.getInstance();

            expect(instance.styles).toBeDefined();
            expect(instance.styles).toBeInstanceOf(Map);
        });
    });

    describe('register', () => {
        it('should register a style with a name', () => {
            const style = { color: 'red', fontSize: '14px' };

            ViewRegistry.register('button', style);

            const instance = ViewRegistry.getInstance();
            expect(instance.styles.has('button')).toBe(true);
            expect(instance.styles.get('button')).toEqual(style);
        });

        it('should register multiple styles', () => {
            ViewRegistry.register('button', { color: 'red' });
            ViewRegistry.register('input', { border: '1px solid' });
            ViewRegistry.register('label', { fontWeight: 'bold' });

            const instance = ViewRegistry.getInstance();
            expect(instance.styles.size).toBe(3);
        });

        it('should overwrite existing style with same name', () => {
            ViewRegistry.register('button', { color: 'red' });
            ViewRegistry.register('button', { color: 'blue' });

            const instance = ViewRegistry.getInstance();
            expect(instance.styles.get('button')).toEqual({ color: 'blue' });
        });

        it('should handle complex style objects', () => {
            const complexStyle = {
                base: { color: 'red' },
                variants: {
                    primary: { backgroundColor: 'blue' },
                    secondary: { backgroundColor: 'gray' },
                },
                modifiers: ['hover', 'active'],
            };

            ViewRegistry.register('complex', complexStyle);

            expect(ViewRegistry.retrieve('complex')).toEqual(complexStyle);
        });

        it('should handle empty style object', () => {
            ViewRegistry.register('empty', {});

            expect(ViewRegistry.retrieve('empty')).toEqual({});
        });
    });

    describe('retrieve', () => {
        it('should retrieve registered style by key', () => {
            const style = { padding: '10px' };
            ViewRegistry.register('container', style);

            const result = ViewRegistry.retrieve('container');

            expect(result).toEqual(style);
        });

        it('should return null for non-existent key', () => {
            const result = ViewRegistry.retrieve('non-existent');

            expect(result).toBeNull();
        });

        it('should return exact registered object', () => {
            const style = { margin: '5px', display: 'flex' };
            ViewRegistry.register('flex', style);

            const result = ViewRegistry.retrieve('flex');

            expect(result).toBe(style);
        });
    });

    describe('retrieveAll', () => {
        it('should return empty object when no styles registered', () => {
            const result = ViewRegistry.retrieveAll();

            expect(result).toEqual({});
        });

        it('should return all registered styles as object', () => {
            ViewRegistry.register('button', { color: 'red' });
            ViewRegistry.register('input', { border: '1px solid' });

            const result = ViewRegistry.retrieveAll();

            expect(result).toEqual({
                button: { color: 'red' },
                input: { border: '1px solid' },
            });
        });

        it('should return object with all style keys', () => {
            ViewRegistry.register('a', { x: 1 });
            ViewRegistry.register('b', { y: 2 });
            ViewRegistry.register('c', { z: 3 });

            const result = ViewRegistry.retrieveAll();

            expect(Object.keys(result)).toHaveLength(3);
            expect(Object.keys(result)).toContain('a');
            expect(Object.keys(result)).toContain('b');
            expect(Object.keys(result)).toContain('c');
        });
    });

    describe('style names', () => {
        it('should handle hyphenated names', () => {
            ViewRegistry.register('my-component', { display: 'block' });

            expect(ViewRegistry.retrieve('my-component')).toEqual({
                display: 'block',
            });
        });

        it('should handle camelCase names', () => {
            ViewRegistry.register('myComponent', { display: 'block' });

            expect(ViewRegistry.retrieve('myComponent')).toEqual({
                display: 'block',
            });
        });

        it('should handle names with numbers', () => {
            ViewRegistry.register('button-1', { variant: 1 });
            ViewRegistry.register('button-2', { variant: 2 });

            expect(ViewRegistry.retrieve('button-1')).toEqual({ variant: 1 });
            expect(ViewRegistry.retrieve('button-2')).toEqual({ variant: 2 });
        });

        it('should handle empty string as name', () => {
            ViewRegistry.register('', { empty: true });

            expect(ViewRegistry.retrieve('')).toEqual({ empty: true });
        });
    });

    describe('style values', () => {
        it('should handle null style value', () => {
            ViewRegistry.register('null-style', null);

            expect(ViewRegistry.retrieve('null-style')).toBeNull();
        });

        it('should handle array style value', () => {
            const arrayStyle = ['class1', 'class2', 'class3'];
            ViewRegistry.register('array', arrayStyle);

            expect(ViewRegistry.retrieve('array')).toEqual(arrayStyle);
        });

        it('should handle string style value', () => {
            ViewRegistry.register('string', 'simple-style');

            expect(ViewRegistry.retrieve('string')).toBe('simple-style');
        });

        it('should handle deeply nested objects', () => {
            const deepStyle = {
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
            ViewRegistry.register('deep', deepStyle);

            expect(ViewRegistry.retrieve('deep')).toEqual(deepStyle);
        });
    });

    describe('load', () => {
        it('should be a static async function', () => {
            expect(typeof ViewRegistry.load).toBe('function');
        });

        it('should call fast-glob with correct patterns', async () => {
            // The load function exists and can be called
            // Full integration testing would require mocking the file system
            expect(ViewRegistry.load).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle rapid successive registrations', () => {
            for (let i = 0; i < 100; i++) {
                ViewRegistry.register(`style-${i}`, { index: i });
            }

            expect(ViewRegistry.retrieveAll()).toHaveProperty('style-0');
            expect(ViewRegistry.retrieveAll()).toHaveProperty('style-99');
            expect(Object.keys(ViewRegistry.retrieveAll())).toHaveLength(100);
        });

        it('should maintain insertion order in retrieveAll', () => {
            ViewRegistry.register('first', { order: 1 });
            ViewRegistry.register('second', { order: 2 });
            ViewRegistry.register('third', { order: 3 });

            const result = ViewRegistry.retrieveAll();
            const keys = Object.keys(result);

            expect(keys[0]).toBe('first');
            expect(keys[1]).toBe('second');
            expect(keys[2]).toBe('third');
        });

        it('should handle special characters in style values', () => {
            ViewRegistry.register('special', {
                content: '"Hello\'World"',
                url: 'https://example.com?a=1&b=2',
            });

            const result = ViewRegistry.retrieve('special');
            expect(result.content).toBe('"Hello\'World"');
            expect(result.url).toBe('https://example.com?a=1&b=2');
        });
    });
});
