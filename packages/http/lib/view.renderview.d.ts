export declare class CMMVRenderer {
    private cache;
    constructor();
    private createNullProtoObjWherePossible;
    private shallowCopyFromList;
    private handleCache;
    compile(template: string, opts: any): (data: Record<string, any>) => Promise<string>;
    render(template: string, d: any, o?: any): Promise<any>;
    renderFile(filename: string, data: any, opts: any, cb: Function): void;
    clearCache(): void;
}
