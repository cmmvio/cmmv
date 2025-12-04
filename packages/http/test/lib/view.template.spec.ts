import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock node:fs
vi.mock('node:fs', () => ({
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    statSync: vi.fn(() => ({ mtimeMs: Date.now() - 30000, mtime: new Date() })),
    unlinkSync: vi.fn(),
}));

// Mock node:path
vi.mock('node:path', () => ({
    resolve: vi.fn((...args) => args.join('/')),
    join: vi.fn((...args) => args.join('/')),
}));

// Mock node:process
vi.mock('node:process', () => ({
    cwd: vi.fn(() => '/test/cwd'),
}));

// Mock fast-glob
vi.mock('fast-glob', () => ({
    default: vi.fn().mockResolvedValue([]),
}));

// Mock uglify-js
vi.mock('uglify-js', () => ({
    default: {
        minify: vi.fn((code) => ({ code: 'minified' })),
    },
    minify: vi.fn((code) => ({ code: 'minified' })),
}));

// Mock html-minifier-terser
vi.mock('html-minifier-terser', () => ({
    minify: vi.fn((html) => html),
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            const configMap: Record<string, any> = {
                'view.extractInlineScript': false,
                'view.minifyHTML': false,
                'view.vue3': false,
                'view.scriptsTimestamp': false,
                'view.plugins': [],
                head: { title: 'Test', meta: [], link: [] },
                scripts: [],
                rpc: { enabled: false },
            };
            return configMap[key] ?? defaultValue;
        }),
        getAll: vi.fn(() => ({
            rpc: { enabled: false },
        })),
    },
    Telemetry: {
        start: vi.fn(),
        end: vi.fn(),
        getTelemetry: vi.fn(() => ({})),
        clearTelemetry: vi.fn(),
    },
}));

// Mock utils
vi.mock('../../templates/utils.cjs', () => ({
    hasOwnOnlyObject: vi.fn((obj) => obj || {}),
    createNullProtoObjWherePossible: vi.fn(() => ({})),
}));

// Mock ViewRegistry
vi.mock('../../registries/view.registry', () => ({
    ViewRegistry: {
        retrieveAll: vi.fn(() => ({})),
    },
}));

import { Template, Directive } from '../../lib/view.template';
import * as fs from 'node:fs';
import { Config, Telemetry } from '@cmmv/core';

describe('Template', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create a template with text', () => {
            const template = new Template('<div>Hello</div>');

            expect(template.templateText).toBe('<div>Hello</div>');
        });

        it('should create a template without text', () => {
            const template = new Template();

            expect(template.templateText).toBeUndefined();
        });

        it('should accept options parameter', () => {
            const template = new Template('<div>Hello</div>', { nonce: 'abc123' });

            expect(template).toBeDefined();
        });

        it('should handle null options', () => {
            const template = new Template('<div>Hello</div>', null);

            expect(template).toBeDefined();
        });
    });

    describe('use', () => {
        it('should add a single directive', () => {
            const template = new Template('<div>Hello</div>');
            const directive: Directive = (text) => text;

            template.use(directive);

            // Directive is added internally
            expect(template).toBeDefined();
        });

        it('should add multiple directives as array', () => {
            const template = new Template('<div>Hello</div>');
            const directive1: Directive = (text) => text + '1';
            const directive2: Directive = (text) => text + '2';

            template.use([directive1, directive2]);

            expect(template).toBeDefined();
        });

        it('should add directives incrementally', () => {
            const template = new Template('<div>Hello</div>');
            const directive1: Directive = (text) => text;
            const directive2: Directive = (text) => text;

            template.use(directive1);
            template.use(directive2);

            expect(template).toBeDefined();
        });
    });

    describe('setContext and getContext', () => {
        it('should set context value', () => {
            const template = new Template();

            template.setContext('user', { name: 'John' });

            expect(template.getContext().user).toEqual({ name: 'John' });
        });

        it('should get empty context initially', () => {
            const template = new Template();

            expect(template.getContext()).toEqual({});
        });

        it('should set multiple context values', () => {
            const template = new Template();

            template.setContext('key1', 'value1');
            template.setContext('key2', 'value2');

            const context = template.getContext();
            expect(context.key1).toBe('value1');
            expect(context.key2).toBe('value2');
        });

        it('should overwrite existing context value', () => {
            const template = new Template();

            template.setContext('key', 'value1');
            template.setContext('key', 'value2');

            expect(template.getContext().key).toBe('value2');
        });

        it('should handle complex data types', () => {
            const template = new Template();
            const complexData = {
                nested: { deep: { value: 42 } },
                array: [1, 2, 3],
                fn: () => 'test',
            };

            template.setContext('complex', complexData);

            expect(template.getContext().complex).toEqual(complexData);
        });
    });

    describe('compile', () => {
        it('should return a function', () => {
            const template = new Template('<div>Hello</div>');
            const compiled = template.compile();

            expect(typeof compiled).toBe('function');
        });

        it('should execute directives when called', async () => {
            const template = new Template('<div>Hello</div>');
            const directive = vi.fn((text) => text.replace('Hello', 'World'));

            template.use(directive);
            const compiled = template.compile();

            const result = await compiled({ requestId: '123' });

            expect(directive).toHaveBeenCalled();
            expect(result).toContain('World');
        });

        it('should handle directives that return objects', async () => {
            const template = new Template('<div>Hello</div>');
            const directive = vi.fn(() => ({
                html: '<div>Setup Content</div>',
                setup: null,
            }));

            template.use(directive);
            const compiled = template.compile();

            const result = await compiled({ requestId: '123' });

            expect(result).toContain('Setup Content');
        });

        it('should call Telemetry.start and Telemetry.end', async () => {
            const template = new Template('<div>Hello</div>');
            const compiled = template.compile();

            await compiled({ requestId: '123' });

            expect(Telemetry.start).toHaveBeenCalledWith(
                'Compile Template',
                '123',
            );
            expect(Telemetry.end).toHaveBeenCalled();
        });

        it('should pass data to directives', async () => {
            const template = new Template('<div>Hello</div>');
            const directive = vi.fn((text, data) => {
                return `<div>${data.name}</div>`;
            });

            template.use(directive);
            const compiled = template.compile();

            const result = await compiled({ requestId: '123', name: 'Test' });

            expect(directive).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ name: 'Test' }),
                template,
            );
        });

        it('should chain multiple directives', async () => {
            const template = new Template('<div>Hello</div>');
            const directive1 = vi.fn((text) => text.replace('Hello', 'Hi'));
            const directive2 = vi.fn((text) => text.replace('div', 'span'));

            template.use(directive1);
            template.use(directive2);
            const compiled = template.compile();

            const result = await compiled({ requestId: '123' });

            expect(directive1).toHaveBeenCalled();
            expect(directive2).toHaveBeenCalled();
            expect(result).toContain('Hi');
            expect(result).toContain('span');
        });
    });

    describe('parseHead', () => {
        it('should parse meta tags', () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'head')
                    return {
                        meta: [{ name: 'description', content: 'Test page' }],
                        link: [],
                    };
                return undefined;
            });

            const template = new Template();
            const headContent = template.parseHead({});

            expect(headContent).toContain('<meta');
            expect(headContent).toContain('name="description"');
            expect(headContent).toContain('content="Test page"');
        });

        it('should parse link tags', () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'head')
                    return {
                        meta: [],
                        link: [
                            { rel: 'stylesheet', href: '/styles.css' },
                        ],
                    };
                return undefined;
            });

            const template = new Template('<div>Test</div>', { nonce: 'abc' });
            const headContent = template.parseHead({});

            expect(headContent).toContain('<link');
            expect(headContent).toContain('rel="stylesheet"');
            expect(headContent).toContain('href="/styles.css"');
        });

        it('should merge setup head with config head', () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'head')
                    return { meta: [{ charset: 'utf-8' }], link: [] };
                return undefined;
            });

            const template = new Template();
            const setup = {
                head: {
                    meta: [{ name: 'author', content: 'Test Author' }],
                },
            };
            const headContent = template.parseHead(setup);

            expect(headContent).toContain('charset="utf-8"');
            expect(headContent).toContain('name="author"');
        });

        it('should handle empty head config', () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'head') return {};
                return undefined;
            });

            const template = new Template();
            const headContent = template.parseHead({});

            expect(headContent).toBe('');
        });
    });

    describe('parseScripts', () => {
        it('should parse script tags from config', () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'scripts')
                    return [{ src: '/app.js', type: 'module' }];
                if (key === 'view.scriptsTimestamp') return false;
                return defaultValue;
            });

            const template = new Template();
            const scriptsContent = template.parseScripts();

            expect(scriptsContent).toContain('<script');
            expect(scriptsContent).toContain('src="/app.js"');
            expect(scriptsContent).toContain('type="module"');
        });

        it('should handle @ prefixed scripts', () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'scripts') return [{ src: '@vue/dist/vue.js' }];
                if (key === 'view.scriptsTimestamp') return false;
                return defaultValue;
            });

            const template = new Template();
            const scriptsContent = template.parseScripts();

            expect(scriptsContent).toContain('node_modules/@vue/dist/vue.js');
        });

        it('should add nonce to scripts', () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'scripts') return [{ src: '/app.js' }];
                if (key === 'view.scriptsTimestamp') return false;
                return defaultValue;
            });

            const template = new Template('<div></div>', { nonce: 'test-nonce' });
            const scriptsContent = template.parseScripts();

            expect(scriptsContent).toContain('nonce="test-nonce"');
        });

        it('should return empty string when no scripts configured', () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'scripts') return null;
                return defaultValue;
            });

            const template = new Template();
            const scriptsContent = template.parseScripts();

            expect(scriptsContent).toBe('');
        });
    });

    describe('parseLayout', () => {
        it('should replace slot with page contents', () => {
            const template = new Template('<div>Test</div>', { nonce: 'abc' });
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'head') return { title: 'Test', meta: [], link: [] };
                if (key === 'scripts') return [];
                return defaultValue;
            });

            const layoutTemplate = '<html><body><slot></slot></body></html>';
            const pageContents = '<div>Page Content</div>';

            const result = template.parseLayout(layoutTemplate, pageContents, {});

            expect(result).toContain('Page Content');
        });

        it('should replace headers placeholder', () => {
            const template = new Template('<div>Test</div>', { nonce: 'abc' });
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'head') return { title: 'My Title', meta: [], link: [] };
                if (key === 'scripts') return [];
                if (key === 'view.vue3') return false;
                return defaultValue;
            });

            const layoutTemplate = '<html><head><headers></headers></head><body><slot/></body></html>';

            const result = template.parseLayout(layoutTemplate, 'content', {
                title: 'Custom Title',
            });

            expect(result).toContain('<title>Custom Title</title>');
        });

        it('should replace scripts placeholder', () => {
            const template = new Template('<div>Test</div>', { nonce: 'test' });
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'head') return { title: 'Test', meta: [], link: [] };
                if (key === 'scripts') return [{ src: '/app.js' }];
                if (key === 'view.scriptsTimestamp') return false;
                return defaultValue;
            });

            const layoutTemplate = '<html><body><slot/><scripts></scripts></body></html>';

            const result = template.parseLayout(layoutTemplate, 'content', {});

            expect(result).toContain('<script');
            expect(result).toContain('src="/app.js"');
        });
    });

    describe('deepMerge', () => {
        it('should merge simple objects', () => {
            const template = new Template();
            const target = { a: 1 };
            const source = { b: 2 };

            const result = template.deepMerge(target, source);

            expect(result).toEqual({ a: 1, b: 2 });
        });

        it('should merge nested objects', () => {
            const template = new Template();
            const target = { nested: { a: 1 } };
            const source = { nested: { b: 2 } };

            const result = template.deepMerge(target, source);

            expect(result.nested).toEqual({ a: 1, b: 2 });
        });

        it('should merge arrays by concatenation and deduplication', () => {
            const template = new Template();
            const target = { items: [1, 2] };
            const source = { items: [2, 3] };

            const result = template.deepMerge(target, source);

            expect(result.items).toEqual([1, 2, 3]);
        });

        it('should handle meta and link arrays specially', () => {
            const template = new Template();
            const target = { meta: [{ name: 'a', content: '1' }] };
            const source = { meta: [{ name: 'b', content: '2' }] };

            const result = template.deepMerge(target, source);

            expect(result.meta).toHaveLength(2);
        });

        it('should not duplicate meta entries', () => {
            const template = new Template();
            const target = { meta: [{ name: 'a', content: '1' }] };
            const source = { meta: [{ name: 'a', content: '1' }] };

            const result = template.deepMerge(target, source);

            expect(result.meta).toHaveLength(1);
        });

        it('should handle multiple sources', () => {
            const template = new Template();
            const target = { a: 1 };
            const source1 = { b: 2 };
            const source2 = { c: 3 };

            const result = template.deepMerge(target, source1, source2);

            expect(result).toEqual({ a: 1, b: 2, c: 3 });
        });

        it('should overwrite primitive values', () => {
            const template = new Template();
            const target = { value: 'old' };
            const source = { value: 'new' };

            const result = template.deepMerge(target, source);

            expect(result.value).toBe('new');
        });
    });

    describe('isEqualObject', () => {
        it('should return true for equal objects', () => {
            const template = new Template();

            expect(
                template.isEqualObject({ a: 1, b: 2 }, { a: 1, b: 2 }),
            ).toBe(true);
        });

        it('should return false for different objects', () => {
            const template = new Template();

            expect(
                template.isEqualObject({ a: 1 }, { a: 2 }),
            ).toBe(false);
        });

        it('should return true for equal nested objects', () => {
            const template = new Template();

            expect(
                template.isEqualObject(
                    { nested: { value: 1 } },
                    { nested: { value: 1 } },
                ),
            ).toBe(true);
        });

        it('should return false for objects with different keys', () => {
            const template = new Template();

            expect(
                template.isEqualObject({ a: 1 }, { b: 1 }),
            ).toBe(false);
        });

        it('should return true for equal arrays', () => {
            const template = new Template();

            expect(template.isEqualObject([1, 2, 3], [1, 2, 3])).toBe(true);
        });

        it('should return false for different arrays', () => {
            const template = new Template();

            expect(template.isEqualObject([1, 2], [1, 2, 3])).toBe(false);
        });
    });

    describe('processSetup', () => {
        it('should return html when no setup', async () => {
            const template = new Template('<div>Test</div>');
            template.setContext('requestId', '123');

            const result = {
                html: '<div>No Setup</div>',
                setup: null,
            };

            const pageContents = await template.processSetup(result);

            expect(pageContents).toBe('<div>No Setup</div>');
        });

        it('should call Telemetry when processing setup', async () => {
            const template = new Template('<div>Test</div>');
            template.setContext('requestId', '123');

            const result = {
                html: '<div>Content</div>',
                setup: null,
            };

            await template.processSetup(result);

            expect(Telemetry.start).toHaveBeenCalledWith('Process Setup', '123');
            expect(Telemetry.end).toHaveBeenCalledWith('Process Setup', '123');
        });

        it('should handle result without setup property', async () => {
            const template = new Template('<div>Test</div>');
            template.setContext('requestId', '123');

            const result = {
                html: '<div>Simple</div>',
            };

            const pageContents = await template.processSetup(result);

            expect(pageContents).toBe('<div>Simple</div>');
        });
    });

    describe('Directive type', () => {
        it('should accept string return type', async () => {
            const directive: Directive = (text, data, template) => {
                return text.toUpperCase();
            };

            const result = directive('<div>test</div>', {}, new Template());
            expect(result).toBe('<DIV>TEST</DIV>');
        });

        it('should accept object return type', async () => {
            const directive: Directive = (text, data, template) => {
                return { html: text, setup: { data: {} } };
            };

            const result = directive('<div>test</div>', {}, new Template());
            expect(result).toEqual({ html: '<div>test</div>', setup: { data: {} } });
        });

        it('should receive all parameters', () => {
            const mockTemplate = new Template();
            const directive: Directive = vi.fn((text, data, template) => text);

            directive('<div>test</div>', { key: 'value' }, mockTemplate);

            expect(directive).toHaveBeenCalledWith(
                '<div>test</div>',
                { key: 'value' },
                mockTemplate,
            );
        });
    });

    describe('edge cases', () => {
        it('should handle empty template text', async () => {
            const template = new Template('');
            const compiled = template.compile();

            const result = await compiled({ requestId: '123' });

            expect(result).toBe('');
        });

        it('should handle template with only whitespace', async () => {
            const template = new Template('   \n\t   ');
            const compiled = template.compile();

            const result = await compiled({ requestId: '123' });

            expect(result).toBe('   \n\t   ');
        });

        it('should handle unicode content', async () => {
            const template = new Template('<div>你好世界 🌍</div>');
            const compiled = template.compile();

            const result = await compiled({ requestId: '123' });

            expect(result).toContain('你好世界 🌍');
        });

        it('should handle HTML entities', async () => {
            const template = new Template('<div>&lt;script&gt;</div>');
            const compiled = template.compile();

            const result = await compiled({ requestId: '123' });

            expect(result).toContain('&lt;script&gt;');
        });

        it('should handle large template', async () => {
            const largeContent = '<div>'.repeat(100) + 'Content' + '</div>'.repeat(100);
            const template = new Template(largeContent);
            const compiled = template.compile();

            const result = await compiled({ requestId: '123' });

            expect(result).toContain('Content');
        });
    });
});
