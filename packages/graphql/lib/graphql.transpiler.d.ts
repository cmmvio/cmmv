import { AbstractTranspile, ITranspile } from '@cmmv/core';
export declare class GraphQLTranspile extends AbstractTranspile implements ITranspile {
    resolvers: Map<string, any>;
    run(): Promise<void>;
    private generateResolvers;
    private generateClassImports;
    private getControllerDecorators;
    private generateClassField;
    private mapToTsType;
    private mapToTsTypeUpper;
}
