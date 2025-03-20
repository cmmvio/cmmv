import * as fs from 'node:fs';
import * as path from 'node:path';
import * as fg from 'fast-glob';
import chokidar from 'chokidar';

const { WebSocketServer, WebSocket } = require('ws');

import {
    Logger,
    Service,
    Application,
    Hook,
    HooksType,
    IContract,
} from '@cmmv/core';

import { cwd } from 'node:process';

@Service('sandbox')
export class SandboxService {
    public static logger: Logger = new Logger('Repository');
    public static chokidar;

    @Hook(HooksType.onHTTPServerInit)
    public definePublicDir() {
        Application.instance
            .getHttpAdapter()
            .setPublicDir(path.join(__dirname.replace('src', 'public')));
    }

    public static async loadConfig(): Promise<void> {
        const clients = [];

        const wsServer = new WebSocketServer({
            port: 4200,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3,
                },
                serverMaxWindowBits: 10,
                concurrencyLimit: 10,
                threshold: 1024,
            },
        });

        wsServer.on('connection', function connection(ws) {
            clients.push(ws);
        });

        const broadcast = (data) => {
            wsServer.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN)
                    client.send(JSON.stringify(data), { binary: false });
            });
        };

        const files = await fg([
            path.resolve(__dirname, '../public/sandbox.client.cjs'),
            path.resolve(__dirname, '../public/sandbox.css'),
            path.resolve(__dirname, '../public/**/*.html'),
            path.resolve(__dirname, '../public/*.html'),
        ]);

        SandboxService.chokidar = chokidar
            .watch(files, {
                persistent: true,
                ignoreInitial: true,
                usePolling: true,
                binaryInterval: 300,
                interval: 100,
                awaitWriteFinish: {
                    stabilityThreshold: 200,
                    pollInterval: 100,
                },
            })
            .on('change', (filePath) => {
                broadcast({ event: 'change', filePath });
            })
            .on('unlink', (filePath) => {
                broadcast({ event: 'unlink', filePath });
            })
            .on('error', (error) => {
                console.error('Erro no Chokidar:', error);
            });
    }

    public async resolveStyle() {
        return await fs.readFileSync(
            path.join(__dirname.replace('src', 'public'), 'sandbox.css'),
            'utf-8',
        );
    }

    /*public async generateContractFromAI(prompt: string) {
        try {
            const TransformersApi = Function('return import("@xenova/transformers")')();
            const { pipeline } = await TransformersApi;
            const generationPipeline = await pipeline('text-generation', 'Xenova/distilgpt2');

            const enhancedPrompt = `Generate JSON schemas for a CMMV application based on this description: "${prompt}".
Format the output as a valid JSON with contracts structure. Include appropriate fields, messages and services.
Example format:
{
  "contracts": [
    {
      "contractName": "Entity",
      "controllerName": "EntityController",
      "fields": [
        {"propertyKey": "id", "protoType": "string"},
        {"propertyKey": "name", "protoType": "string"}
      ],
      "messages": [],
      "services": []
    }
  ]
}`;

            // Generate text using the model
            const result = await generationPipeline(enhancedPrompt, {
                max_new_tokens: 500,
                temperature: 0.7,
                num_return_sequences: 1,
            });

            const generatedText = result[0].generated_text;
            const jsonMatch = generatedText.match(/\{[\s\S]*\}/);

            if (!jsonMatch)
                throw new Error('Generated text does not contain valid JSON');

            return {
                jsonMatch
            };
        } catch (error) {
            SandboxService.logger.error(`Error generating contracts from AI: ${error.message}`);

            // Fallback to rule-based generation if AI generation fails
            try {
                const contractsData = await this.analyzePromptAndGenerateContracts(prompt);
                return {
                    success: true,
                    warning: "AI generation failed, using rule-based generation instead.",
                    contracts: contractsData
                };
            } catch (fallbackError) {
                return {
                    success: false,
                    error: `AI generation failed: ${error.message}. Fallback also failed: ${fallbackError.message}`,
                    contracts: []
                };
            }
        }
    }

    private async analyzePromptAndGenerateContracts(prompt: string): Promise<IContract[]> {
        const promptLower = prompt.toLowerCase();
        const entityKeywords = promptLower.match(/\b(\w+)\b/g) || [];

        const commonWords = ['generate', 'create', 'for', 'with', 'and', 'the', 'a', 'an', 'contracts', 'contract', 'model', 'models'];
        const potentialEntities = entityKeywords
            .filter(word => !commonWords.includes(word) && word.length > 3)
            .filter((value, index, self) => self.indexOf(value) === index);

        return potentialEntities.map(entity => this.generateContractTemplate(entity));
    }

    private generateContractTemplate(entityName: string): IContract {
        const capitalizedName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

        const contract: IContract = {
            isPublic: true,
            contractName: capitalizedName,
            controllerName: `${capitalizedName}Controller`,
            subPath: '',
            fields: [
                {
                    propertyKey: 'id',
                    protoType: 'string',
                    unique: true,
                    index: true
                },
                {
                    propertyKey: 'name',
                    protoType: 'string'
                },
                {
                    propertyKey: 'description',
                    protoType: 'string'
                }
            ],
            messages: [],
            services: [],
            directMessage: false,
            generateController: true,
            generateEntities: true,
            auth: false,
            rootOnly: false,
            options: {
                description: `Generated ${capitalizedName} contract`,
                databaseSchemaName: entityName.toLowerCase(),
                databaseTimestamps: true,
                databaseUserAction: true
            }
        };

        return contract;
    }*/
}
