import * as path from 'path';
import * as fs from 'fs';
import { Logger } from './logger';

export interface ITranspile {
    run(): void;
}

export abstract class AbstractTranspile {
    public getRootPath(contract: any, context: string): string {
        let outputDir = contract.subPath
            ? path.join('src', context, contract.subPath)
            : path.join('src', context);

        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });

        return outputDir;
    }

    public getImportPath(contract: any, context: string, filename: string) {
        return contract.subPath
            ? `${contract.subPath
                  .split('/')
                  .map(() => '../')
                  .join('')}${context}${contract.subPath}/${filename}`
            : `../${context}/${filename}`;
    }
}

export class Transpile {
    private logger: Logger = new Logger('Transpile');
    private transpilers: Array<new () => ITranspile>;

    constructor(transpilers: Array<new () => ITranspile> = []) {
        this.transpilers = transpilers;
    }

    public add(transpiler: new () => ITranspile): void {
        this.transpilers.push(transpiler);
    }

    public async transpile(): Promise<any[]> {
        try {
            const transpilePromises = this.transpilers.map(TranspilerClass => {
                if (typeof TranspilerClass == 'function') {
                    const transpiler = new TranspilerClass();
                    return transpiler.run();
                }
            });

            return Promise.all(transpilePromises);
        } catch (error) {
            console.error(error);
            this.logger.error(error);
            throw error;
        }
    }
}
