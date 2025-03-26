import { AbstractTranspile, ITranspile } from '../lib';
export declare class ContractsTranspile extends AbstractTranspile implements ITranspile {
    run(): void;
    private generateSchema;
}
