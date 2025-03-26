import * as path from 'node:path';
import * as fs from 'node:fs';
import * as yaml from 'js-yaml';

import { AbstractTranspile, ITranspile, Scope, Config, Module } from '../lib';

import { IContract } from '../interfaces/contract.interface';

export class ContractsTranspile
    extends AbstractTranspile
    implements ITranspile
{
    run(): void {
        const contracts = Scope.getArray<any>('__contracts');
        this.generateSchema(contracts);
    }

    private async generateSchema(contracts: IContract[]): Promise<void> {
        const generateSchema = Config.get<boolean>('app.generateSchema', true);
        const generatedDir = Config.get<string>(
            'app.generatedDir',
            '.generated',
        );
        const outputFilename = path.join(generatedDir, 'schema.json');

        if (!fs.existsSync(generatedDir))
            fs.mkdirSync(generatedDir, { recursive: true });

        if (generateSchema) {
            let schema: any = {
                contracts: {},
                modules: {
                    auth: Module.hasModule('auth'),
                    graphql: Module.hasModule('graphql'),
                    rpc: Module.hasModule('protobuf') && Module.hasModule('ws'),
                    openapi: Module.hasModule('openapi'),
                    cache: Module.hasModule('cache'),
                    repository: Module.hasModule('repository'),
                    vault: Module.hasModule('vault'),
                },
            };

            for (let key in contracts) {
                schema.contracts[contracts[key].contractName] = contracts[key];
            }

            const schemaJSON = JSON.parse(JSON.stringify(schema));

            await fs.writeFileSync(
                outputFilename,
                JSON.stringify(schema, null, 4),
            );

            await fs.writeFileSync(
                outputFilename.replace('.json', '.yml'),
                yaml.dump(schemaJSON, {
                    indent: 2,
                }),
            );
        }
    }
}
