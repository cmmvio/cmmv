import { ITranspile, AbstractTranspile } from '@cmmv/core';
export declare class DefaultHTTPTranspiler extends AbstractTranspile implements ITranspile {
    run(): void;
    private generateService;
    private getControllerDecorators;
    private generateController;
    private generateModule;
    private getMethodFormated;
    private importServices;
}
