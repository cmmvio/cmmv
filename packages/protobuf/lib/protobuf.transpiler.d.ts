import { AbstractTranspile, ITranspile } from '@cmmv/core';
export declare class ProtobufTranspile extends AbstractTranspile implements ITranspile {
    private logger;
    private imports;
    run(): Promise<void>;
    private generateProtoContent;
    private generateTypes;
    private generateContractsJs;
    returnContractJs(): Promise<string>;
    private mapToProtoType;
    private mapToTsType;
    private clearImports;
    private addImport;
}
