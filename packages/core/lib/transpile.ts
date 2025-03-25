import * as path from 'node:path';
import * as fs from 'node:fs';

import { Config } from './config';
import { Logger } from './logger';
import { SUB_PATH_METADATA } from '../decorators';

export interface ITranspile {
    run(): Promise<any> | void;
}

export abstract class AbstractTranspile {
    abstract run(): Promise<any> | void;

    public getRootPath(
        contract: any,
        context: string,
        createDirectory: boolean = true,
    ): string {
        const rootDir = Config.get<string>('app.sourceDir', 'src');

        let outputDir = contract.subPath
            ? path.join(rootDir, context, contract.subPath)
            : path.join(rootDir, context);

        if (createDirectory && !fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });

        return outputDir;
    }

    public getGeneratedPath(
        contract: any,
        context: string,
        createDirectory: boolean = true,
    ): string {
        const generatedDir = Config.get<string>(
            'app.generatedDir',
            '.generated',
        );

        let outputDir = contract.subPath
            ? path.join(generatedDir, context, contract.subPath)
            : path.join(generatedDir, context);

        if (createDirectory && !fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });

        return outputDir;
    }

    public getImportPath(
        contract: any,
        context: string,
        filename: string,
        alias?: string,
    ) {
        let basePath = contract.subPath
            ? `${contract.subPath
                  .split('/')
                  .map(() => '../')
                  .join('')}${context}${contract.subPath}/${filename}`
            : `../${context}/${filename}`;

        return alias
            ? `${alias}${basePath
                  .replace(context, '')
                  .replace(/\.\.\//gim, '')}`
            : basePath;
    }

    public getImportPathWithoutSubPath(
        contract: any,
        context: string,
        filename: string,
        alias?: string,
    ) {
        let basePath = contract.subPath
            ? `${contract.subPath
                  .split('/')
                  .map(() => '../')
                  .join('')}${context}/${filename}`
            : `../${context}/${filename}`;

        return alias
            ? `${alias}${basePath
                  .replace(context, '')
                  .replace(/\.\.\//gim, '')}`
            : basePath;
    }

    public getImportPathRelative(
        contract: any,
        contractTo: any,
        context: string,
        filename: string,
        alias?: string,
    ) {
        const contractSubPath = Reflect.getMetadata(
            SUB_PATH_METADATA,
            contract,
        );

        if (contractTo.subPath === contractSubPath) return `./${filename}`;

        let relativePath = contractTo.subPath
            ? `${contractTo.subPath
                  .split('/')
                  .map(() => '../')
                  .join('')}${context}${contractTo.subPath}/${filename}`
            : `../${context}/${filename}`;

        return alias
            ? `${alias}${relativePath
                  .replace(context, '')
                  .replace(/\.\.\//gim, '')}`
            : relativePath;
    }

    public removeExtraSpaces(code: string): string {
        return code
            .replace(/\n{3,}/g, '\n\n')
            .replace(/(\n\s*\n\s*\n)/g, '\n\n');
    }

    public removeTelemetry(code: string): string {
        const lines = code.split('\n');
        const filteredLines = lines.filter(
            (line) =>
                !line.includes('Telemetry.') && !line.includes('{ Telemetry }'),
        );
        return filteredLines.join('\n');
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
            const transpilePromises = this.transpilers.map(
                (TranspilerClass) => {
                    if (typeof TranspilerClass == 'function') {
                        const transpiler = new TranspilerClass();
                        return transpiler.run();
                    }
                },
            );

            return Promise.all(transpilePromises);
        } catch (error) {
            //console.error(error);
            this.logger.error(error);
            throw error;
        }
    }
}
