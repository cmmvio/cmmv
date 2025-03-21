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
    Config,
    Compile,
    SUB_PATH_METADATA,
    PUBLIC_METADATA,
    CONTROLLER_NAME_METADATA,
    IContract,
    Scope,
} from '@cmmv/core';

import { RepositoryMigration } from '@cmmv/repository';

import { cwd } from 'node:process';

@Service('sandbox')
export class SandboxService {
    public static logger: Logger = new Logger('Repository');
    public static chokidar;
    public static port: number;

    /**
     * Define the public directory
     */
    @Hook(HooksType.onHTTPServerInit)
    public definePublicDir() {
        Application.instance
            .getHttpAdapter()
            .setPublicDir(path.join(__dirname.replace('src', 'public')));
    }

    /**
     * Load the config
     */
    public static async loadConfig(): Promise<void> {
        const clients = [];
        const portDefault = 59885;
        const port = Config.get<number>('sandbox.port', portDefault);
        SandboxService.port = port;

        const wsServer = new WebSocketServer({
            port,
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

    /**
     * Resolve the style
     * @returns The style
     */
    public async resolveStyle() {
        return await fs.readFileSync(
            path.join(__dirname.replace('src', 'public'), 'sandbox.css'),
            'utf-8',
        );
    }

    /**
     * Get the web socket port
     * @returns The web socket port
     */
    public getWebSocketPort() {
        return SandboxService.port;
    }

    /**
     * Compile the contract
     * @param schema - The schema of the contract
     * @returns The success and message of the operation
     */
    public async compileContract(schema: IContract) {
        const filanameRaw = schema.contractName
            .toLowerCase()
            .replace('contract', '.contract');
        const schemaFilename = path.join(
            cwd(),
            'src',
            'contracts',
            filanameRaw + '.ts',
        );
        const outputDir = path.dirname(schemaFilename);

        if (fs.existsSync(schemaFilename)) {
            const contracts = Scope.getArray<any>('__contracts');

            for (const contract of contracts) {
                if (contract.contractName === schema.contractName) {
                    await RepositoryMigration.generateMigration(
                        contract,
                        schema,
                    );
                }
            }
        } else {
            await RepositoryMigration.generateMigration(null, schema);
        }

        return Compile.getInstance().compileSchema(schema, schemaFilename);
    }

    /**
     * Delete the contract
     * @param contractName - The name of the contract to delete
     * @returns The success and message of the operation
     */
    public async deleteContract(contractName: string) {
        const contract = Application.getContract(contractName);

        if (contract) {
            const instance = new contract();

            const isPublic = Reflect.getMetadata(
                PUBLIC_METADATA,
                instance.constructor,
            );

            if (!isPublic)
                return { success: false, message: 'Contract is not public' };

            const subPath = Reflect.getMetadata(
                SUB_PATH_METADATA,
                instance.constructor,
            );

            const controllerName = Reflect.getMetadata(
                CONTROLLER_NAME_METADATA,
                instance.constructor,
            );

            const contractPath = subPath
                ? path.join(
                      cwd(),
                      'src',
                      'contracts',
                      subPath,
                      `${controllerName.toLowerCase()}.contract.ts`,
                  )
                : path.join(
                      cwd(),
                      'src',
                      'contracts',
                      `${controllerName.toLowerCase()}.contract.ts`,
                  );

            if (fs.existsSync(contractPath)) await fs.unlinkSync(contractPath);

            const contracts = Scope.getArray<any>('__contracts');

            for (const contractStructure of contracts) {
                if (contractStructure.contractName === contractName)
                    await RepositoryMigration.generateMigration(
                        contractStructure,
                        null,
                    );
            }

            const contractFiles = [
                path.join(
                    cwd(),
                    'src',
                    'controllers',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.controller.ts`,
                ),
                path.join(
                    cwd(),
                    '.generated',
                    'controllers',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.controller.ts`,
                ),
                path.join(
                    cwd(),
                    'src',
                    'entities',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.entity.ts`,
                ),
                path.join(
                    cwd(),
                    '.generated',
                    'entities',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.entity.ts`,
                ),
                path.join(
                    cwd(),
                    'src',
                    'gateways',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.gateway.ts`,
                ),
                path.join(
                    cwd(),
                    '.generated',
                    'gateways',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.gateway.ts`,
                ),
                path.join(
                    cwd(),
                    'src',
                    'resolvers',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.resolver.ts`,
                ),
                path.join(
                    cwd(),
                    '.generated',
                    'resolvers',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.resolver.ts`,
                ),
                path.join(
                    cwd(),
                    'src',
                    'models',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.model.ts`,
                ),
                path.join(
                    cwd(),
                    '.generated',
                    'models',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.model.ts`,
                ),
                path.join(
                    cwd(),
                    'src',
                    'services',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.service.ts`,
                ),
                path.join(
                    cwd(),
                    '.generated',
                    'services',
                    subPath ? subPath : '',
                    `${controllerName.toLowerCase()}.service.ts`,
                ),
            ];

            contractFiles.forEach(async (file) => {
                if (fs.existsSync(file)) await fs.unlinkSync(file);
            });
        }

        return { success: true, message: 'Contract deleted successfully' };
    }
}
