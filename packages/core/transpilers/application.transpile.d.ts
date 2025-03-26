import { AbstractTranspile, ITranspile } from '../lib';
export declare class ApplicationTranspile extends AbstractTranspile implements ITranspile {
    run(): void;
    private generateModel;
    private generateClassImports;
    private generateClassField;
    private mapToTsType;
    private mapToTsTypeUpper;
    private generateJsonSchemaField;
    private mapToJsonSchemaType;
    private generateDTOs;
}
