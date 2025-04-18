import { vi } from 'vitest';

export class MockViewUtils {
    public static getValueFromKey = vi
        .fn()
        .mockImplementation((data: Record<string, any>, key: string): any => {
            return key.split('.').reduce((acc, part) => acc && acc[part], data);
        });

    public static reset(): void {
        MockViewUtils.getValueFromKey.mockClear();
    }
}

export class MockViewEval {
    private static evalCache: Record<string, Function> = Object.create(null);

    public static evaluate = vi
        .fn()
        .mockImplementation((scope: any, exp: string, el?: Node) => {
            return MockViewEval.execute(scope, `return(${exp})`, el);
        });

    public static evaluateAsync = vi
        .fn()
        .mockImplementation(
            async (scope: any, exp: string, el?: Node): Promise<any> => {
                return new Promise(async (resolve, reject) => {
                    try {
                        const result = await MockViewEval.evaluate(
                            scope,
                            exp,
                            el,
                        );
                        resolve(result);
                    } catch (error) {
                        reject(`Evaluation error: ${error.message}`);
                    }
                });
            },
        );

    public static execute = vi
        .fn()
        .mockImplementation((scope: any, exp: string, el?: Node) => {
            const fn =
                MockViewEval.evalCache[exp] ||
                (MockViewEval.evalCache[exp] = MockViewEval.toFunction(exp));
            try {
                return fn(scope, el);
            } catch (e) {
                return undefined;
            }
        });

    public static toFunction = vi
        .fn()
        .mockImplementation((exp: string): Function => {
            try {
                return vi.fn().mockImplementation((data) => {
                    if (exp.includes('return')) {
                        const match = exp.match(/return\s*\(?([^;]*)\)?/);
                        if (match && match[1]) {
                            const prop = match[1].trim();
                            if (prop.indexOf('.') > 0) {
                                return MockViewUtils.getValueFromKey(
                                    data,
                                    prop,
                                );
                            }
                            return data[prop];
                        }
                    }
                    return `[Mocked evaluation of: ${exp}]`;
                });
            } catch (e) {
                return () => {};
            }
        });

    public static reset(): void {
        MockViewEval.evalCache = Object.create(null);
        MockViewEval.evaluate.mockClear();
        MockViewEval.evaluateAsync.mockClear();
        MockViewEval.execute.mockClear();
        MockViewEval.toFunction.mockClear();
    }
}

export type Directive = (
    templateText: string,
    data: Record<string, any>,
    template: MockTemplate,
) => string | object | Promise<string | object>;

export class MockViewDirectives {
    public static ssrLoadData = vi
        .fn()
        .mockImplementation(
            async (
                templateText: string,
                data: Record<string, any>,
                template: MockTemplate,
            ): Promise<string> => {
                return templateText;
            },
        ) as unknown as Directive & { mockClear: () => void };

    public static sData = vi
        .fn()
        .mockImplementation(
            async (
                templateText: string,
                data: Record<string, any>,
                template: MockTemplate,
            ): Promise<string> => {
                return templateText.replace(
                    /<([^>]+)\s([^>]+)s-data=[""](.+?)[""]([^>]*)>(.*?)<\/\1>/g,
                    (
                        match,
                        tagName,
                        attributesBefore,
                        key,
                        attributesAfter,
                        innerHTML,
                    ) => {
                        const value = MockViewUtils.getValueFromKey(
                            data,
                            key.trim(),
                        );
                        if (value !== undefined) {
                            return `<${tagName} ${attributesBefore} ${attributesAfter}>${value}</${tagName}>`;
                        } else {
                            return `<!-- s-data not found: ${key} -->`;
                        }
                    },
                );
            },
        ) as unknown as Directive & { mockClear: () => void };

    public static sAttr = vi
        .fn()
        .mockImplementation(
            (
                templateText: string,
                data: Record<string, any>,
                template: MockTemplate,
            ): string => {
                return templateText.replace(
                    /<([^>]+)\s+s-attr=[""](.+?)[""]([^>]*)>/g,
                    (match, tagName, key, attributes) => {
                        const value = MockViewUtils.getValueFromKey(
                            data,
                            key.trim(),
                        );
                        if (value !== undefined) {
                            return `<${tagName} ${attributes} ${key}="${value}">`;
                        } else {
                            return `<!-- s-attr not found: ${key} -->`;
                        }
                    },
                );
            },
        ) as unknown as Directive & { mockClear: () => void };

    public static sServerData = vi
        .fn()
        .mockImplementation(
            (
                templateText: string,
                data: Record<string, any>,
                template: MockTemplate,
            ): string => {
                return templateText.replace(/\{(\w+)\}/g, (match, key) => {
                    const value = MockViewUtils.getValueFromKey(
                        data,
                        key.trim(),
                    );
                    return value !== undefined ? value : '';
                });
            },
        ) as unknown as Directive & { mockClear: () => void };

    public static i18n = vi
        .fn()
        .mockImplementation(
            (
                templateText: string,
                data: Record<string, any>,
                template: MockTemplate,
            ): string => {
                const translations = { 'test.key': 'Test Translation' };
                return templateText.replace(
                    /<(\w+)([^>]*)\s+s-i18n=[""](.+?)[""]([^>]*)>(.*?)<\/\1>/g,
                    (
                        match,
                        tagName,
                        beforeAttrs,
                        key,
                        afterAttrs,
                        innerHTML,
                    ) => {
                        const translation = translations[key?.trim()];
                        if (translation) {
                            return `<${tagName}${beforeAttrs}${afterAttrs}>${translation}</${tagName}>`;
                        } else {
                            return `<!-- s-i18n not found: ${key} -->`;
                        }
                    },
                );
            },
        ) as unknown as Directive & { mockClear: () => void };

    public static ssrDirectives = vi
        .fn()
        .mockImplementation(
            async (
                templateText: string,
                data: Record<string, any>,
                template: MockTemplate,
            ): Promise<string> => {
                return templateText;
            },
        ) as unknown as Directive & { mockClear: () => void };

    public static extractSetupScript = vi
        .fn()
        .mockImplementation(
            async (templateText: string): Promise<object | string> => {
                const regex =
                    /<script\s+[^>]*s-setup[^>]*>([\s\S]*?)<\/script>/;
                const scriptMatch = templateText.match(regex);

                if (scriptMatch) {
                    return {
                        html: templateText.replace(
                            regex,
                            () => `<!-- setup -->`,
                        ),
                        setup: {
                            data: () => ({}),
                            methods: {},
                            mounted: null,
                            created: null,
                        },
                    };
                } else {
                    return templateText;
                }
            },
        ) as unknown as Directive & { mockClear: () => void };

    public static reset(): void {
        MockViewDirectives.ssrLoadData.mockClear();
        MockViewDirectives.sData.mockClear();
        MockViewDirectives.sAttr.mockClear();
        MockViewDirectives.sServerData.mockClear();
        MockViewDirectives.i18n.mockClear();
        MockViewDirectives.ssrDirectives.mockClear();
        MockViewDirectives.extractSetupScript.mockClear();
    }
}

export class MockTemplate {
    templateText: string;
    private directives: Directive[] = [];
    private nonce: string;
    private context: any = {};

    constructor(text?: string, optsParam?: any) {
        this.templateText = text || '';
        this.nonce = optsParam?.nonce || '';
    }

    use(directives: Directive | Directive[]) {
        if (Array.isArray(directives)) this.directives.push(...directives);
        else this.directives.push(directives);

        return this;
    }

    setContext(value: string, data: any) {
        this.context[value] = data;
    }

    getContext() {
        return this.context;
    }

    async loadIncludes(templateText: string): Promise<string> {
        return templateText;
    }

    async extractInlineScripts(html: string): Promise<string> {
        return html;
    }

    async minifyHtml(html: string): Promise<string> {
        return html;
    }

    async processSetup(result: any) {
        if (typeof result === 'object' && result.html) return result.html;

        return result;
    }

    parseLayout(template: string, pageContents: string, setup: any) {
        let result = template
            .replace(/<slot\s*\/?>/i, pageContents)
            .replace(/<headers\s*\/?>/i, '<title>Mock Title</title>')
            .replace(/<scripts\s*\/?>/i, '');
        return result;
    }

    compile() {
        const self = this;
        return async function (data: Record<string, any>) {
            let processedText = self.templateText;
            self.context.requestId = data.requestId || 'mock-request-id';

            for (const directive of self.directives) {
                const result: any = await directive(processedText, data, self);
                if (typeof result === 'string') {
                    processedText = result;
                } else if (typeof result === 'object') {
                    processedText = await self.processSetup(result);
                }
            }

            return processedText;
        };
    }

    static reset(): void {}
}

export class MockCMMVRenderer {
    private cache: Map<string, Function>;

    constructor() {
        this.cache = new Map();
    }

    compile(template: string, opts: any = {}) {
        const templ = new MockTemplate(template, opts);

        templ.use([
            MockViewDirectives.ssrLoadData,
            MockViewDirectives.extractSetupScript,
            MockViewDirectives.sServerData,
            MockViewDirectives.ssrDirectives,
            MockViewDirectives.sData,
            MockViewDirectives.sAttr,
            MockViewDirectives.i18n,
        ]);

        return templ.compile();
    }

    async render(template: string, data: any = {}, opts: any = {}) {
        try {
            const handle = this.compile(template, opts);
            return await handle(data);
        } catch (err) {
            console.error('Error during rendering:', err);
            throw err;
        }
    }

    renderFile(filename: string, data: any, opts: any, cb: Function) {
        const content = `<html><body>Mocked file content for: ${filename}</body></html>`;

        setTimeout(() => {
            try {
                const handle = this.compile(content, opts);
                handle(data).then((rendered) => {
                    cb(null, rendered);
                });
            } catch (err) {
                cb(err);
            }
        }, 0);
    }

    clearCache() {
        this.cache.clear();
    }

    static reset(): void {}
}

export class MockHttpView {
    public static ViewUtils = MockViewUtils;
    public static ViewEval = MockViewEval;
    public static ViewDirectives = MockViewDirectives;
    public static Template = MockTemplate;
    public static CMMVRenderer = MockCMMVRenderer;

    public static reset(): void {
        MockViewUtils.reset();
        MockViewEval.reset();
        MockViewDirectives.reset();
        MockTemplate.reset();
        MockCMMVRenderer.reset();
    }

    public static getMockModule() {
        return {
            getValueFromKey: MockViewUtils.getValueFromKey,
            evaluate: MockViewEval.evaluate,
            evaluateAsync: MockViewEval.evaluateAsync,
            execute: MockViewEval.execute,
            toFunction: MockViewEval.toFunction,

            ssrLoadData: MockViewDirectives.ssrLoadData,
            sData: MockViewDirectives.sData,
            sAttr: MockViewDirectives.sAttr,
            sServerData: MockViewDirectives.sServerData,
            i18n: MockViewDirectives.i18n,
            ssrDirectives: MockViewDirectives.ssrDirectives,
            extractSetupScript: MockViewDirectives.extractSetupScript,

            Template: MockTemplate,
            CMMVRenderer: MockCMMVRenderer,
        };
    }
}

/**
 * Alias para facilitar o uso
 */
export const mockHttpView = MockHttpView;
export const getValueFromKey = MockViewUtils.getValueFromKey;

export const evaluate = MockViewEval.evaluate;
export const evaluateAsync = MockViewEval.evaluateAsync;
export const execute = MockViewEval.execute;
export const toFunction = MockViewEval.toFunction;

export const ssrLoadData = MockViewDirectives.ssrLoadData;
export const sData = MockViewDirectives.sData;
export const sAttr = MockViewDirectives.sAttr;
export const sServerData = MockViewDirectives.sServerData;
export const i18n = MockViewDirectives.i18n;
export const ssrDirectives = MockViewDirectives.ssrDirectives;
export const extractSetupScript = MockViewDirectives.extractSetupScript;

export const Template = MockTemplate;
export const CMMVRenderer = MockCMMVRenderer;
