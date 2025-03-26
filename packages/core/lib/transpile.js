"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transpile = exports.AbstractTranspile = void 0;
const path = require("node:path");
const fs = require("node:fs");
const config_1 = require("./config");
const logger_1 = require("./logger");
const decorators_1 = require("../decorators");
class AbstractTranspile {
    getRootPath(contract, context, createDirectory = true) {
        const rootDir = config_1.Config.get('app.sourceDir', 'src');
        let outputDir = contract.subPath
            ? path.join(rootDir, context, contract.subPath)
            : path.join(rootDir, context);
        if (createDirectory && !fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });
        return outputDir;
    }
    getGeneratedPath(contract, context, createDirectory = true) {
        const generatedDir = config_1.Config.get('app.generatedDir', '.generated');
        let outputDir = contract.subPath
            ? path.join(generatedDir, context, contract.subPath)
            : path.join(generatedDir, context);
        if (createDirectory && !fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });
        return outputDir;
    }
    getImportPath(contract, context, filename, alias) {
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
    getImportPathWithoutSubPath(contract, context, filename, alias) {
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
    getImportPathRelative(contract, contractTo, context, filename, alias) {
        const contractSubPath = Reflect.getMetadata(decorators_1.SUB_PATH_METADATA, contract.constructor);
        if (contractTo.subPath === contractSubPath)
            return `./${filename}`;
        let relativePath = contractTo.subPath
            ? `${contractTo.subPath
                .split('/')
                .map(() => '../')
                .join('')}${context}${contractSubPath}/${filename}`
            : `../${context}/${filename}`;
        return alias
            ? `${alias}${relativePath
                .replace(context, '')
                .replace(/\.\.\//gim, '')}`
            : relativePath;
    }
    removeExtraSpaces(code) {
        return code
            .replace(/\n{3,}/g, '\n\n')
            .replace(/(\n\s*\n\s*\n)/g, '\n\n');
    }
    removeTelemetry(code) {
        const lines = code.split('\n');
        const filteredLines = lines.filter((line) => !line.includes('Telemetry.') && !line.includes('{ Telemetry }'));
        return filteredLines.join('\n');
    }
}
exports.AbstractTranspile = AbstractTranspile;
class Transpile {
    constructor(transpilers = []) {
        this.logger = new logger_1.Logger('Transpile');
        this.transpilers = transpilers;
    }
    add(transpiler) {
        this.transpilers.push(transpiler);
    }
    async transpile() {
        try {
            const transpilePromises = this.transpilers.map((TranspilerClass) => {
                if (typeof TranspilerClass == 'function') {
                    const transpiler = new TranspilerClass();
                    return transpiler.run();
                }
            });
            return Promise.all(transpilePromises);
        }
        catch (error) {
            //console.error(error);
            this.logger.error(error);
            throw error;
        }
    }
}
exports.Transpile = Transpile;
