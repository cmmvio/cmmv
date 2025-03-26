export interface ITranspile {
    run(): Promise<any> | void;
}
export declare abstract class AbstractTranspile {
    abstract run(): Promise<any> | void;
    getRootPath(contract: any, context: string, createDirectory?: boolean): string;
    getGeneratedPath(contract: any, context: string, createDirectory?: boolean): string;
    getImportPath(contract: any, context: string, filename: string, alias?: string): string;
    getImportPathWithoutSubPath(contract: any, context: string, filename: string, alias?: string): string;
    getImportPathRelative(contract: any, contractTo: any, context: string, filename: string, alias?: string): string;
    removeExtraSpaces(code: string): string;
    removeTelemetry(code: string): string;
}
export declare class Transpile {
    private logger;
    private transpilers;
    constructor(transpilers?: Array<new () => ITranspile>);
    add(transpiler: new () => ITranspile): void;
    transpile(): Promise<any[]>;
}
