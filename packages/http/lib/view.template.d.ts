export type Directive = (templateText: string, data: Record<string, any>, template: Template) => string | object;
export declare class Template {
    templateText: string;
    private directives;
    private nonce;
    private context;
    constructor(text?: string, optsParam?: any);
    use(directives: Directive | Directive[]): void;
    setContext(value: string, data: any): void;
    getContext(): any;
    private loadIncludes;
    private extractInlineScripts;
    private cleanupExpiredFiles;
    private minifyHtml;
    processSetup(result: any): Promise<any>;
    parseLayout(template: string, pageContents: string, setup: any): string;
    parseHead(setup: any): string;
    parseScripts(): string;
    deepMerge(target: any, ...sources: any[]): any;
    isEqualObject(obj1: any, obj2: any): boolean;
    compile(): (data: Record<string, any>) => Promise<string>;
}
