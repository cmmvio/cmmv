"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsTranspile = void 0;
const path = require("node:path");
const fs = require("node:fs");
const yaml = require("js-yaml");
const lib_1 = require("../lib");
class ContractsTranspile extends lib_1.AbstractTranspile {
    run() {
        const contracts = lib_1.Scope.getArray('__contracts');
        this.generateSchema(contracts);
    }
    async generateSchema(contracts) {
        const generateSchema = lib_1.Config.get('app.generateSchema', true);
        const generatedDir = lib_1.Config.get('app.generatedDir', '.generated');
        const outputFilename = path.join(generatedDir, 'schema.json');
        if (!fs.existsSync(generatedDir))
            fs.mkdirSync(generatedDir, { recursive: true });
        if (generateSchema) {
            let schema = {
                contracts: {},
                modules: {
                    auth: lib_1.Module.hasModule('auth'),
                    graphql: lib_1.Module.hasModule('graphql'),
                    rpc: lib_1.Module.hasModule('protobuf') && lib_1.Module.hasModule('ws'),
                    openapi: lib_1.Module.hasModule('openapi'),
                    cache: lib_1.Module.hasModule('cache'),
                    repository: lib_1.Module.hasModule('repository'),
                    vault: lib_1.Module.hasModule('vault'),
                },
            };
            for (let key in contracts) {
                schema.contracts[contracts[key].contractName] = contracts[key];
            }
            const schemaJSON = JSON.parse(JSON.stringify(schema));
            await fs.writeFileSync(outputFilename, JSON.stringify(schema, null, 4));
            await fs.writeFileSync(outputFilename.replace('.json', '.yml'), yaml.dump(schemaJSON, {
                indent: 2,
            }));
        }
    }
}
exports.ContractsTranspile = ContractsTranspile;
