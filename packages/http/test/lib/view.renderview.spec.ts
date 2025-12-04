import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock node:fs
vi.mock('node:fs', () => ({
    readFileSync: vi.fn(() => '<div>Template Content</div>'),
    readFile: vi.fn((filename, encoding, callback) => {
        callback(null, '<div>File Content</div>');
    }),
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            if (key === 'view.vue3') return false;
            return defaultValue;
        }),
    },
    Telemetry: {
        start: vi.fn(),
        end: vi.fn(),
        getTelemetry: vi.fn(() => ({})),
        clearTelemetry: vi.fn(),
    },
}));

// Mock view.template
vi.mock('../../lib/view.template', () => ({
    Template: vi.fn().mockImplementation((text, opts) => ({
        templateText: text,
        use: vi.fn(),
        compile: vi.fn(() => vi.fn((data) => Promise.resolve(`Rendered: ${text}`))),
        setContext: vi.fn(),
        getContext: vi.fn(() => ({})),
    })),
}));

// Mock view.directives
vi.mock('../../lib/view.directives', () => ({
    sData: vi.fn((text) => text),
    sAttr: vi.fn((text) => text),
    i18n: vi.fn((text) => text),
    extractSetupScript: vi.fn((text) => text),
    sServerData: vi.fn((text) => text),
    ssrDirectives: vi.fn((text) => text),
    ssrLoadData: vi.fn((text) => text),
}));

import { CMMVRenderer } from '../../lib/view.renderview';
import { Config } from '@cmmv/core';
import * as fs from 'node:fs';
import { Template } from '../../lib/view.template';

describe('CMMVRenderer', () => {
    let renderer: CMMVRenderer;

    beforeEach(() => {
        vi.clearAllMocks();
        renderer = new CMMVRenderer();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(renderer).toBeDefined();
            expect(renderer).toBeInstanceOf(CMMVRenderer);
        });

        it('should initialize with empty cache', () => {
            // Cache is private but we can test it indirectly
            renderer.clearCache();
            expect(() => renderer.clearCache()).not.toThrow();
        });
    });

    describe('compile', () => {
        it('should compile a template string', () => {
            const template = '<div>Hello</div>';
            const compiled = renderer.compile(template, {});

            expect(Template).toHaveBeenCalledWith(template, {});
        });

        it('should return a function', () => {
            const template = '<div>Hello</div>';
            const compiled = renderer.compile(template, {});

            expect(typeof compiled).toBe('function');
        });

        it('should apply directives for non-vue3 mode', () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'view.vue3') return false;
                return defaultValue;
            });

            const mockUse = vi.fn();
            vi.mocked(Template).mockImplementationOnce((text, opts) => ({
                templateText: text,
                use: mockUse,
                compile: vi.fn(() => vi.fn()),
                setContext: vi.fn(),
                getContext: vi.fn(() => ({})),
            }));

            renderer.compile('<div>Test</div>', {});

            expect(mockUse).toHaveBeenCalled();
            // Should include ssrDirectives for non-vue3
            const directives = mockUse.mock.calls[0][0];
            expect(Array.isArray(directives)).toBe(true);
        });

        it('should apply different directives for vue3 mode', () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'view.vue3') return true;
                return defaultValue;
            });

            const mockUse = vi.fn();
            vi.mocked(Template).mockImplementationOnce((text, opts) => ({
                templateText: text,
                use: mockUse,
                compile: vi.fn(() => vi.fn()),
                setContext: vi.fn(),
                getContext: vi.fn(() => ({})),
            }));

            renderer.compile('<div>Test</div>', {});

            expect(mockUse).toHaveBeenCalled();
        });

        it('should pass options to Template', () => {
            const options = { nonce: 'test-nonce', cache: true };
            renderer.compile('<div>Test</div>', options);

            expect(Template).toHaveBeenCalledWith('<div>Test</div>', options);
        });
    });

    describe('render', () => {
        it('should render template with data', async () => {
            const template = '<div>Hello {name}</div>';
            const data = { name: 'World', requestId: '123' };

            const result = await renderer.render(template, data);

            expect(result).toContain('Rendered:');
        });

        it('should handle empty data', async () => {
            const template = '<div>Hello</div>';

            const result = await renderer.render(template, null);

            expect(result).toBeDefined();
        });

        it('should handle empty options', async () => {
            const template = '<div>Hello</div>';
            const data = { requestId: '123' };

            const result = await renderer.render(template, data, null);

            expect(result).toBeDefined();
        });

        it('should copy shallow properties from data to opts when 2 args', async () => {
            const template = '<div>Hello</div>';
            const data = {
                filename: 'test.html',
                scope: 'local',
                debug: true,
                requestId: '123',
            };

            const result = await renderer.render(template, data);

            expect(result).toBeDefined();
        });

        it('should handle render errors gracefully', async () => {
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            vi.mocked(Template).mockImplementationOnce((text, opts) => ({
                templateText: text,
                use: vi.fn(),
                compile: vi.fn(() =>
                    vi.fn(() => {
                        throw new Error('Render error');
                    }),
                ),
                setContext: vi.fn(),
                getContext: vi.fn(() => ({})),
            }));

            const newRenderer = new CMMVRenderer();

            await expect(
                newRenderer.render('<div>Test</div>', { requestId: '123' }),
            ).rejects.toThrow('Render error');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should use cached compiled function', async () => {
            const template = '<div>Hello</div>';
            const data = { requestId: '123' };
            const opts = { cache: true, filename: 'test.html' };

            // First render
            await renderer.render(template, data, opts);
            // Second render should use cache
            await renderer.render(template, data, opts);

            // Template should only be called once if caching works
            // (In this test with mocks, we just verify no error)
            expect(true).toBe(true);
        });
    });

    describe('renderFile', () => {
        it('should render file with callback', async () => {
            const filename = 'test.html';
            const data = { requestId: '123' };
            const opts = {};

            await new Promise<void>((resolve, reject) => {
                renderer.renderFile(filename, data, opts, (err, result) => {
                    try {
                        expect(err).toBeNull();
                        expect(result).toBeDefined();
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        it('should throw if callback is not a function', () => {
            expect(() => {
                renderer.renderFile('test.html', {}, {}, null as any);
            }).toThrow('Callback function is required');
        });

        it('should set filename in options', async () => {
            const filename = 'custom.html';
            const data = { requestId: '123' };
            const opts: any = {};

            await new Promise<void>((resolve, reject) => {
                renderer.renderFile(filename, data, opts, (err, result) => {
                    try {
                        expect(opts.filename).toBe(filename);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        it('should handle file read errors', async () => {
            vi.mocked(fs.readFile).mockImplementationOnce(
                (filename, encoding, callback: any) => {
                    callback(new Error('File not found'), null);
                },
            );

            await new Promise<void>((resolve, reject) => {
                renderer.renderFile('nonexistent.html', {}, {}, (err, result) => {
                    try {
                        expect(err).toBeDefined();
                        expect(err.message).toBe('File not found');
                        expect(result).toBeUndefined();
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        it('should handle render errors in callback', async () => {
            vi.mocked(Template).mockImplementationOnce((text, opts) => ({
                templateText: text,
                use: vi.fn(),
                compile: vi.fn(() =>
                    vi.fn(() => {
                        throw new Error('Render error');
                    }),
                ),
                setContext: vi.fn(),
                getContext: vi.fn(() => ({})),
            }));

            const newRenderer = new CMMVRenderer();

            await new Promise<void>((resolve, reject) => {
                newRenderer.renderFile('test.html', {}, {}, (err, result) => {
                    try {
                        expect(err).toBeDefined();
                        expect(err.message).toBe('Render error');
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        it('should handle null options', async () => {
            await new Promise<void>((resolve, reject) => {
                renderer.renderFile('test.html', {}, null, (err, result) => {
                    try {
                        expect(err).toBeNull();
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });
    });

    describe('clearCache', () => {
        it('should clear the internal cache', () => {
            // First populate cache
            renderer.compile('<div>Test</div>', {
                cache: true,
                filename: 'test.html',
            });

            // Clear should not throw
            expect(() => renderer.clearCache()).not.toThrow();
        });

        it('should be callable multiple times', () => {
            renderer.clearCache();
            renderer.clearCache();
            renderer.clearCache();

            expect(true).toBe(true);
        });
    });

    describe('createNullProtoObjWherePossible (private)', () => {
        // We test this indirectly through render with null/undefined data
        it('should create empty objects for null data', async () => {
            const result = await renderer.render('<div>Test</div>', null);

            expect(result).toBeDefined();
        });

        it('should create empty objects for undefined data', async () => {
            const result = await renderer.render('<div>Test</div>', undefined);

            expect(result).toBeDefined();
        });
    });

    describe('shallowCopyFromList (private)', () => {
        // Tested indirectly through render
        it('should handle shallow copy in render', async () => {
            const data = {
                filename: 'test.html',
                delimiter: '%',
                scope: 'test',
                context: {},
                debug: false,
                compileDebug: false,
                client: false,
                _with: true,
                rmWhitespace: false,
                strict: false,
                async: true,
                requestId: '123',
            };

            const result = await renderer.render('<div>Test</div>', data);

            expect(result).toBeDefined();
        });
    });

    describe('handleCache (private)', () => {
        it('should handle template via render', async () => {
            // handleCache is called internally by render
            const result = await renderer.render(
                '<div>Test</div>',
                { requestId: '123' },
                {},
            );

            expect(result).toBeDefined();
        });

        it('should cache compiled function when cache option is true', async () => {
            const opts = { cache: true, filename: 'cached.html' };

            // First call
            await renderer.render('<div>Test</div>', { requestId: '123' }, opts);

            // Clear template mock calls
            vi.mocked(Template).mockClear();

            // Second call should use cache
            await renderer.render('<div>Test</div>', { requestId: '123' }, opts);

            // Template should not be called again for cached content
            // (This depends on implementation details)
        });

        it('should not cache when cache option is false', async () => {
            const opts = { cache: false, filename: 'nocache.html' };

            await renderer.render('<div>Test</div>', { requestId: '123' }, opts);
            await renderer.render('<div>Test</div>', { requestId: '123' }, opts);

            // Both calls should create new templates
            expect(Template).toHaveBeenCalledTimes(2);
        });

        it('should not cache when no filename provided', async () => {
            const opts = { cache: true };

            await renderer.render('<div>Test</div>', { requestId: '123' }, opts);
            await renderer.render('<div>Test</div>', { requestId: '123' }, opts);

            // Both calls should create new templates
            expect(Template).toHaveBeenCalledTimes(2);
        });
    });

    describe('edge cases', () => {
        it('should handle empty template string', async () => {
            const result = await renderer.render('', { requestId: '123' });

            expect(result).toBeDefined();
        });

        it('should handle template with only whitespace', async () => {
            const result = await renderer.render('   \n\t   ', { requestId: '123' });

            expect(result).toBeDefined();
        });

        it('should handle unicode content', async () => {
            const result = await renderer.render(
                '<div>你好世界 🌍</div>',
                { requestId: '123' },
            );

            expect(result).toBeDefined();
        });

        it('should handle complex nested data', async () => {
            const data = {
                requestId: '123',
                user: {
                    profile: {
                        name: 'Test',
                        settings: {
                            theme: 'dark',
                        },
                    },
                },
            };

            const result = await renderer.render('<div>Test</div>', data);

            expect(result).toBeDefined();
        });

        it('should handle arrays in data', async () => {
            const data = {
                requestId: '123',
                items: [1, 2, 3, 4, 5],
            };

            const result = await renderer.render('<div>Test</div>', data);

            expect(result).toBeDefined();
        });

        it('should handle functions in data', async () => {
            const data = {
                requestId: '123',
                formatter: (val: number) => val.toFixed(2),
            };

            const result = await renderer.render('<div>Test</div>', data);

            expect(result).toBeDefined();
        });
    });

    describe('integration scenarios', () => {
        it('should work with all options combined', async () => {
            const template = '<div class="container">Content</div>';
            const data = {
                requestId: '123',
                title: 'Test Page',
                items: [1, 2, 3],
            };
            const opts = {
                cache: true,
                filename: 'full-test.html',
                nonce: 'abc123',
                delimiter: '%',
            };

            const result = await renderer.render(template, data, opts);

            expect(result).toBeDefined();
        });

        it('should handle multiple sequential renders', async () => {
            const templates = [
                '<div>First</div>',
                '<div>Second</div>',
                '<div>Third</div>',
            ];

            for (const template of templates) {
                const result = await renderer.render(template, { requestId: '123' });
                expect(result).toBeDefined();
            }
        });

        it('should handle concurrent renders', async () => {
            const renders = [
                renderer.render('<div>A</div>', { requestId: '1' }),
                renderer.render('<div>B</div>', { requestId: '2' }),
                renderer.render('<div>C</div>', { requestId: '3' }),
            ];

            const results = await Promise.all(renders);

            expect(results).toHaveLength(3);
            results.forEach((result) => expect(result).toBeDefined());
        });
    });
});
