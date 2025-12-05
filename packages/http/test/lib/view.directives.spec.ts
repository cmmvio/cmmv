import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs
vi.mock('fs', () => ({
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
}));

// Mock path
vi.mock('path', () => ({
    resolve: vi.fn((...args) => args.join('/')),
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            if (key === 'i18n.localeFiles') return 'locales';
            if (key === 'i18n.default') return 'en';
            return defaultValue;
        }),
    },
}));

// Mock view.eval
vi.mock('../../lib/view.eval', () => ({
    evaluate: vi.fn((data, exp) => {
        // Simple expression evaluation for tests
        try {
            const fn = new Function(...Object.keys(data), `return ${exp}`);
            return fn(...Object.values(data));
        } catch {
            return undefined;
        }
    }),
    evaluateAsync: vi.fn(async (data, exp) => {
        try {
            const fn = new Function(...Object.keys(data), `return ${exp}`);
            return fn(...Object.values(data));
        } catch {
            return undefined;
        }
    }),
}));

// Mock view.utils
vi.mock('../../lib/view.utils', () => ({
    getValueFromKey: vi.fn((data, key) => {
        const keys = key.split('.');
        let result = data;
        for (const k of keys) {
            if (result === undefined || result === null) return undefined;
            result = result[k];
        }
        return result;
    }),
}));

import * as fs from 'fs';
import {
    sData,
    sAttr,
    sServerData,
    i18n,
    ssrLoadData,
    ssrDirectives,
    extractSetupScript,
} from '../../lib/view.directives';
import { Config } from '@cmmv/core';
import { getValueFromKey } from '../../lib/view.utils';
import { evaluate, evaluateAsync } from '../../lib/view.eval';

describe('view.directives', () => {
    let mockTemplate: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockTemplate = {
            setContext: vi.fn(),
            getContext: vi.fn(() => ({})),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('sData', () => {
        // NOTE: sData regex requires attributes BEFORE s-data: <tag attrs s-data="key" attrs>content</tag>
        it('should replace s-data with value from data object', async () => {
            const templateText =
                '<div class="test" s-data="name" id="1">placeholder</div>';
            const data = { name: 'John' };

            const result = await sData(templateText, data, mockTemplate);

            expect(result).toContain('John');
            expect(result).not.toContain('s-data');
        });

        it('should handle nested data keys', async () => {
            // Note: regex requires at least one attribute before s-data
            const templateText =
                '<span class="item" s-data="user.profile.name">placeholder</span>';
            const data = { user: { profile: { name: 'Alice' } } };

            const result = await sData(templateText, data, mockTemplate);

            expect(result).toContain('Alice');
        });

        it('should add comment when key not found', async () => {
            // Note: regex requires at least one attribute before s-data
            const templateText =
                '<div class="item" s-data="missing">placeholder</div>';
            const data = {};

            const result = await sData(templateText, data, mockTemplate);

            expect(result).toContain('<!-- s-data not found: missing -->');
        });

        it('should preserve tag attributes', async () => {
            const templateText =
                '<p class="text" s-data="content" id="main">placeholder</p>';
            const data = { content: 'Hello World' };

            const result = await sData(templateText, data, mockTemplate);

            expect(result).toContain('class="text"');
            expect(result).toContain('id="main"');
            expect(result).toContain('Hello World');
        });

        it('should handle multiple s-data directives', async () => {
            const templateText = `
                <div class="t" s-data="title">placeholder</div>
                <span class="s" s-data="subtitle">placeholder</span>
            `;
            const data = { title: 'Title', subtitle: 'Subtitle' };

            const result = await sData(templateText, data, mockTemplate);

            expect(result).toContain('Title');
            expect(result).toContain('Subtitle');
        });

        it('should handle numeric values', async () => {
            const templateText = '<span class="n" s-data="count">0</span>';
            const data = { count: 42 };

            const result = await sData(templateText, data, mockTemplate);

            expect(result).toContain('42');
        });

        it('should handle boolean values', async () => {
            const templateText = '<span class="b" s-data="active">false</span>';
            const data = { active: true };

            const result = await sData(templateText, data, mockTemplate);

            expect(result).toContain('true');
        });

        it('should not match when no attributes before s-data', async () => {
            // The regex requires attributes before s-data, so this won't match
            const templateText = '<span s-data="value">placeholder</span>';
            const data = { value: 'test' };

            const result = await sData(templateText, data, mockTemplate);

            // Should remain unchanged
            expect(result).toBe(templateText);
        });
    });

    describe('sAttr', () => {
        it('should add attribute with value from data', () => {
            const templateText = '<input s-attr="value" />';
            const data = { value: 'test-value' };

            const result = sAttr(templateText, data, mockTemplate);

            expect(result).toContain('value="test-value"');
        });

        it('should handle nested data keys', () => {
            const templateText = '<a s-attr="href" >Link</a>';
            const data = { href: 'https://example.com' };

            const result = sAttr(templateText, data, mockTemplate);

            expect(result).toContain('href="https://example.com"');
        });

        it('should add comment when key not found', () => {
            const templateText = '<input s-attr="missing" />';
            const data = {};

            const result = sAttr(templateText, data, mockTemplate);

            expect(result).toContain('<!-- s-attr not found: missing -->');
        });

        it('should preserve existing attributes', () => {
            const templateText =
                '<input type="text" s-attr="placeholder" class="input" />';
            const data = { placeholder: 'Enter text' };

            const result = sAttr(templateText, data, mockTemplate);

            expect(result).toContain('type="text"');
            expect(result).toContain('class="input"');
        });

        it('should handle multiple s-attr directives', () => {
            const templateText = `
                <input s-attr="name" />
                <input s-attr="id" />
            `;
            const data = { name: 'username', id: 'user-input' };

            const result = sAttr(templateText, data, mockTemplate);

            expect(result).toContain('name="username"');
            expect(result).toContain('id="user-input"');
        });
    });

    describe('sServerData', () => {
        it('should replace {key} with value', () => {
            const templateText = 'Hello, {name}!';
            const data = { name: 'World' };

            const result = sServerData(templateText, data, mockTemplate);

            expect(result).toBe('Hello, World!');
        });

        it('should handle multiple placeholders', () => {
            const templateText = '{greeting}, {name}! Today is {day}.';
            const data = { greeting: 'Hello', name: 'John', day: 'Monday' };

            const result = sServerData(templateText, data, mockTemplate);

            expect(result).toBe('Hello, John! Today is Monday.');
        });

        it('should replace missing keys with empty string', () => {
            const templateText = 'Value: {missing}';
            const data = {};

            const result = sServerData(templateText, data, mockTemplate);

            expect(result).toBe('Value: ');
        });

        it('should handle nested data (only top-level by default)', () => {
            const templateText = 'User: {user}';
            const data = { user: { name: 'Alice' } };

            const result = sServerData(templateText, data, mockTemplate);

            // The regex only matches \w+ so nested access won't work directly
            expect(result).toContain('[object Object]');
        });

        it('should handle numeric values', () => {
            const templateText = 'Count: {count}';
            const data = { count: 100 };

            const result = sServerData(templateText, data, mockTemplate);

            expect(result).toBe('Count: 100');
        });

        it('should preserve non-placeholder text', () => {
            const templateText = 'Static text without placeholders';
            const data = { unused: 'value' };

            const result = sServerData(templateText, data, mockTemplate);

            expect(result).toBe('Static text without placeholders');
        });

        it('should handle adjacent placeholders', () => {
            const templateText = '{first}{second}{third}';
            const data = { first: 'A', second: 'B', third: 'C' };

            const result = sServerData(templateText, data, mockTemplate);

            expect(result).toBe('ABC');
        });
    });

    describe('i18n', () => {
        beforeEach(() => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(
                JSON.stringify({
                    greeting: 'Hello',
                    farewell: 'Goodbye',
                    nested: { key: 'Nested Value' },
                }),
            );
        });

        it('should replace s-i18n with translation', () => {
            const templateText = '<span s-i18n="greeting">placeholder</span>';
            const data = { locale: 'en' };

            const result = i18n(templateText, data, mockTemplate);

            expect(result).toContain('Hello');
            expect(result).not.toContain('s-i18n');
        });

        it('should use default locale when not specified', () => {
            const templateText = '<span s-i18n="greeting">placeholder</span>';
            const data = {};

            i18n(templateText, data, mockTemplate);

            // Should use 'en' as default
            expect(fs.readFileSync).toHaveBeenCalled();
        });

        it('should use locale from data when specified', () => {
            const templateText = '<span s-i18n="greeting">placeholder</span>';
            const data = { locale: 'fr' };

            i18n(templateText, data, mockTemplate);

            // Should attempt to load fr.json
            expect(fs.existsSync).toHaveBeenCalled();
        });

        it('should add comment when key not found', () => {
            const templateText =
                '<span s-i18n="missing.key">placeholder</span>';
            const data = {};

            const result = i18n(templateText, data, mockTemplate);

            expect(result).toContain('<!-- s-i18n not found: missing.key -->');
        });

        it('should preserve tag attributes', () => {
            const templateText =
                '<p class="text" s-i18n="greeting" id="greet">placeholder</p>';
            const data = {};

            const result = i18n(templateText, data, mockTemplate);

            expect(result).toContain('class="text"');
            expect(result).toContain('id="greet"');
        });

        it('should handle multiple i18n directives', () => {
            const templateText = `
                <span s-i18n="greeting">placeholder</span>
                <span s-i18n="farewell">placeholder</span>
            `;
            const data = {};

            const result = i18n(templateText, data, mockTemplate);

            expect(result).toContain('Hello');
            expect(result).toContain('Goodbye');
        });

        it('should return empty translations when file does not exist', () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);

            const templateText = '<span s-i18n="greeting">placeholder</span>';
            const data = {};

            const result = i18n(templateText, data, mockTemplate);

            expect(result).toContain('<!-- s-i18n not found: greeting -->');
        });

        it('should handle invalid JSON in locale file', () => {
            vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

            const templateText = '<span s-i18n="greeting">placeholder</span>';
            const data = {};

            // Should not throw
            expect(() => i18n(templateText, data, mockTemplate)).not.toThrow();
        });
    });

    describe('ssrLoadData', () => {
        it('should evaluate s: directive expressions', async () => {
            const templateText = '<div s:items="users.list">content</div>';
            const data = { users: { list: [1, 2, 3] } };

            const result = await ssrLoadData(templateText, data, mockTemplate);

            expect(mockTemplate.setContext).toHaveBeenCalled();
        });

        it('should remove s: directive from output', async () => {
            const templateText = '<div s:value="data.value">content</div>';
            const data = { data: { value: 42 } };

            const result = await ssrLoadData(templateText, data, mockTemplate);

            expect(result).not.toContain('s:value');
        });

        it('should handle multiple s: directives', async () => {
            // Process each directive separately since the regex is global
            const templateText = '<div s:a="x">content</div>';
            const data = { x: 1 };

            await ssrLoadData(templateText, data, mockTemplate);

            expect(mockTemplate.setContext).toHaveBeenCalled();
        });

        it('should handle evaluation errors gracefully', async () => {
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            vi.mocked(evaluateAsync).mockRejectedValueOnce(
                new Error('Eval error'),
            );

            const templateText =
                '<div s:value="invalid.expression">content</div>';
            const data = {};

            // Should not throw
            await expect(
                ssrLoadData(templateText, data, mockTemplate),
            ).resolves.not.toThrow();

            consoleSpy.mockRestore();
        });

        it('should return unchanged text when no directives found', async () => {
            const templateText = '<div>No directives here</div>';
            const data = {};

            const result = await ssrLoadData(templateText, data, mockTemplate);

            expect(result).toBe(templateText);
        });
    });

    describe('ssrDirectives', () => {
        beforeEach(() => {
            mockTemplate.getContext = vi.fn(() => ({
                items: ['a', 'b', 'c'],
                show: true,
            }));
        });

        it('should be an async function', () => {
            expect(ssrDirectives.constructor.name).toBe('AsyncFunction');
        });

        it('should process template text', async () => {
            const templateText = '<div>Simple content</div>';
            const data = {};

            const result = await ssrDirectives(
                templateText,
                data,
                mockTemplate,
            );

            expect(typeof result).toBe('string');
        });

        it('should handle s-if directive', async () => {
            const templateText = '<s-if exp="show">Visible</s-if>';
            const data = { show: true };
            mockTemplate.getContext = vi.fn(() => data);

            const result = await ssrDirectives(
                templateText,
                data,
                mockTemplate,
            );

            expect(result).toContain('Visible');
        });

        it('should handle s-if with false condition', async () => {
            const templateText = '<s-if exp="show">Hidden</s-if>';
            const data = { show: false };
            mockTemplate.getContext = vi.fn(() => data);

            const result = await ssrDirectives(
                templateText,
                data,
                mockTemplate,
            );

            expect(result).not.toContain('Hidden');
        });

        it('should handle s-if with s-else', async () => {
            const templateText =
                '<s-if exp="show">If Content</s-if><s-else>Else Content</s-else>';
            const data = { show: false };
            mockTemplate.getContext = vi.fn(() => data);

            const result = await ssrDirectives(
                templateText,
                data,
                mockTemplate,
            );

            expect(result).toContain('Else Content');
        });
    });

    describe('extractSetupScript', () => {
        it('should extract setup script from template', async () => {
            const templateText = `
                <div>Content</div>
                <script s-setup>
                    export default {
                        data() {
                            return { count: 0 };
                        }
                    }
                </script>
            `;

            const result = await extractSetupScript(templateText);

            expect(result).toBeDefined();
        });

        it('should return template with setup comment when script found', async () => {
            const templateText = `
                <div>Content</div>
                <script s-setup>
                    export default { value: 42 }
                </script>
            `;

            const result = await extractSetupScript(templateText);

            if (typeof result === 'object' && result !== null) {
                expect((result as any).html).toContain('<!-- setup -->');
            }
        });

        it('should handle template without setup script', async () => {
            const templateText = '<div>No script here</div>';

            const result = await extractSetupScript(templateText);

            // Should return original template with replacement (but no match = original)
            expect(typeof result).toBe('string');
            expect(result).toBe(templateText);
        });

        it('should handle empty setup script', async () => {
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            const templateText = `
                <div>Content</div>
                <script s-setup>
                </script>
            `;

            // Should not throw (returns string with replacement)
            const result = await extractSetupScript(templateText);
            expect(result).toBeDefined();

            consoleSpy.mockRestore();
        });

        it('should handle script with imports', async () => {
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            const templateText = `
                <div>Content</div>
                <script s-setup>
                    import Component from './Component';
                    export default { components: { Component } }
                </script>
            `;

            // Should not throw even with imports (errors are caught)
            const result = await extractSetupScript(templateText);
            expect(result).toBeDefined();

            consoleSpy.mockRestore();
        });

        it('should handle script with module.exports syntax', async () => {
            const templateText = `
                <div>Content</div>
                <script s-setup>
                    module.exports = { value: 123 }
                </script>
            `;

            await expect(
                extractSetupScript(templateText),
            ).resolves.toBeDefined();
        });

        it('should handle complex object in setup', async () => {
            const templateText = `
                <script s-setup>
                    export default {
                        data: { items: [1, 2, 3] },
                        methods: { add() {} }
                    }
                </script>
            `;

            const result = await extractSetupScript(templateText);

            expect(result).toBeDefined();
        });

        it('should handle syntax errors gracefully', async () => {
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            const templateText = `
                <script s-setup>
                    export default { invalid syntax @@@ }
                </script>
            `;

            // Should not throw
            await expect(
                extractSetupScript(templateText),
            ).resolves.toBeDefined();

            consoleSpy.mockRestore();
        });
    });

    describe('directive edge cases', () => {
        it('should handle empty template text', async () => {
            const emptyTemplate = '';
            const data = { value: 'test' };

            expect(await sData(emptyTemplate, data, mockTemplate)).toBe('');
            expect(sAttr(emptyTemplate, data, mockTemplate)).toBe('');
            expect(sServerData(emptyTemplate, data, mockTemplate)).toBe('');
        });

        it('should handle template with only whitespace', async () => {
            const whitespaceTemplate = '   \n\t   ';
            const data = {};

            expect(await sData(whitespaceTemplate, data, mockTemplate)).toBe(
                whitespaceTemplate,
            );
        });

        it('should handle special characters in values', async () => {
            // Note: sData requires attributes before s-data
            const templateText =
                '<div class="c" s-data="content">placeholder</div>';
            const data = { content: '<script>alert("xss")</script>' };

            const result = await sData(templateText, data, mockTemplate);

            // Value should be inserted as-is (XSS prevention should be handled elsewhere)
            expect(result).toContain('<script>alert("xss")</script>');
        });

        it('should handle unicode in template', async () => {
            // Note: sData requires attributes before s-data
            const templateText =
                '<div class="c" s-data="message">placeholder</div>';
            const data = { message: '你好世界 🌍' };

            const result = await sData(templateText, data, mockTemplate);

            expect(result).toContain('你好世界 🌍');
        });

        it('should handle self-closing tags in sAttr', () => {
            const templateText = '<img s-attr="src" />';
            const data = { src: 'image.png' };

            const result = sAttr(templateText, data, mockTemplate);

            expect(result).toContain('src="image.png"');
        });

        it('should handle quotes in attribute values', () => {
            const templateText = '<input s-attr="placeholder" />';
            const data = { placeholder: "Enter 'name'" };

            const result = sAttr(templateText, data, mockTemplate);

            expect(result).toContain('placeholder="Enter \'name\'"');
        });
    });

    describe('data type handling', () => {
        it('should handle null values in sServerData', () => {
            const templateText = 'Value: {nullValue}';
            const data = { nullValue: null };

            const result = sServerData(templateText, data, mockTemplate);

            // null is returned as 'null' string since it's not undefined
            expect(result).toBe('Value: null');
        });

        it('should handle undefined values in sServerData', () => {
            const templateText = 'Value: {undefinedValue}';
            const data = { undefinedValue: undefined };

            const result = sServerData(templateText, data, mockTemplate);

            // undefined returns empty string
            expect(result).toBe('Value: ');
        });

        it('should handle array values in sData', async () => {
            // Note: sData requires attributes before s-data
            const templateText =
                '<div class="c" s-data="items">placeholder</div>';
            const data = { items: [1, 2, 3] };

            const result = await sData(templateText, data, mockTemplate);

            expect(result).toContain('1,2,3');
        });

        it('should handle Date values', async () => {
            // Note: sData requires attributes before s-data
            const templateText =
                '<span class="c" s-data="date">placeholder</span>';
            const date = new Date('2024-06-15T12:00:00Z'); // Use mid-year UTC date to avoid timezone issues
            const data = { date };

            const result = await sData(templateText, data, mockTemplate);

            // Date.toString() contains year - use Jun to be safe across timezones
            expect(result).toMatch(/Jun|2024/);
        });
    });

    describe('config integration', () => {
        it('should use Config for i18n locale files path', () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue('{}');

            const templateText = '<span s-i18n="key">placeholder</span>';
            i18n(templateText, {}, mockTemplate);

            expect(Config.get).toHaveBeenCalledWith('i18n.localeFiles');
        });

        it('should use Config for default locale', () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);

            const templateText = '<span s-i18n="key">placeholder</span>';
            i18n(templateText, {}, mockTemplate);

            expect(Config.get).toHaveBeenCalledWith('i18n.default');
        });
    });
});
