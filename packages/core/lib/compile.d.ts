export declare class Compile {
    private static instance;
    private logger;
    static getInstance(): Compile;
    compileSchema(schema: any, outputPath: string): string;
    private validateSchema;
    private generateContractCode;
    private generateImports;
    /**
     * Generate the Contract decorator
     */
    private generateContractDecorator;
    private generateContractClass;
    private generateContractField;
    private generateContractMessage;
    private generateContractService;
    private getContractClassName;
    private getContractName;
}
