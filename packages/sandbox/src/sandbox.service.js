"use strict";
var SandboxService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxService = void 0;
const tslib_1 = require("tslib");
const fs = require("node:fs");
const path = require("node:path");
const fg = require("fast-glob");
const chokidar_1 = require("chokidar");
const { WebSocketServer, WebSocket } = require('ws');
const core_1 = require("@cmmv/core");
const repository_1 = require("@cmmv/repository");
const node_process_1 = require("node:process");
let SandboxService = SandboxService_1 = class SandboxService {
    /**
     * Define the public directory
     */
    definePublicDir() {
        core_1.Application.instance
            .getHttpAdapter()
            .setPublicDir(path.join(__dirname.replace('src', 'public')));
    }
    /**
     * Load the config
     * @returns The success and message of the operation
     */
    static async loadConfig() {
        const portDefault = 59885;
        const port = core_1.Config.get('sandbox.port', portDefault);
        SandboxService_1.port = port;
        SandboxService_1.createWebsocket();
        const files = await fg([
            path.resolve(__dirname, '../public/sandbox*.cjs'),
            path.resolve(__dirname, '../public/sandbox.css'),
            path.resolve(__dirname, '../public/**/*.html'),
            path.resolve(__dirname, '../public/*.html'),
        ]);
        SandboxService_1.chokidar = chokidar_1.default
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
            SandboxService_1.broadcast({ event: 'change', filePath });
        })
            .on('unlink', (filePath) => {
            SandboxService_1.broadcast({ event: 'unlink', filePath });
        })
            .on('error', (error) => {
            console.error('Erro no Chokidar:', error);
        });
    }
    /**
     * Create the web socket
     */
    static createWebsocket() {
        SandboxService_1.clients = [];
        SandboxService_1.wsServer = new WebSocketServer({
            port: SandboxService_1.port,
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
        SandboxService_1.wsServer.on('connection', function connection(ws) {
            SandboxService_1.clients.push(ws);
        });
    }
    /**
     * Broadcast the data to the clients
     * @param data - The data to broadcast
     */
    static broadcast(data) {
        SandboxService_1.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN)
                client.send(JSON.stringify(data), { binary: false });
        });
    }
    /**
     * Close the web socket
     */
    static closeWebsocket() {
        SandboxService_1.clients.forEach((client) => client.close());
        SandboxService_1.wsServer.close();
    }
    /**
     * Resolve the style
     * @returns The style
     */
    async resolveStyle() {
        return await fs.readFileSync(path.join(__dirname.replace('src', 'public'), 'sandbox.css'), 'utf-8');
    }
    /**
     * Get the web socket port
     * @returns The web socket port
     */
    getWebSocketPort() {
        return SandboxService_1.port;
    }
    /**
     * Compile the contract
     * @param schema - The schema of the contract
     * @returns The success and message of the operation
     */
    async compileContract(schema) {
        const filanameRaw = schema.contractName
            .toLowerCase()
            .replace('contract', '.contract');
        const schemaFilename = path.join((0, node_process_1.cwd)(), 'src', 'contracts', filanameRaw + '.ts');
        fs.writeFileSync(schemaFilename.replace('.ts', '.metadata.json'), JSON.stringify(schema, null, 4));
        if (fs.existsSync(schemaFilename)) {
            const contracts = core_1.Scope.getArray('__contracts');
            for (const contract of contracts) {
                if (contract.contractName === schema.contractName) {
                    await repository_1.RepositoryMigration.generateMigration(contract, schema);
                }
            }
        }
        else {
            await repository_1.RepositoryMigration.generateMigration(null, schema);
        }
        return core_1.Compile.getInstance().compileSchema(schema, schemaFilename);
    }
    /**
     * Delete the contract
     * @param contractName - The name of the contract to delete
     * @returns The success and message of the operation
     */
    async deleteContract(contractName) {
        const contract = core_1.Application.getContract(contractName);
        if (contract) {
            const instance = new contract();
            const isPublic = Reflect.getMetadata(core_1.PUBLIC_METADATA, instance.constructor);
            if (!isPublic)
                return { success: false, message: 'Contract is not public' };
            const subPath = Reflect.getMetadata(core_1.SUB_PATH_METADATA, instance.constructor);
            const controllerName = Reflect.getMetadata(core_1.CONTROLLER_NAME_METADATA, instance.constructor);
            const contractPath = subPath
                ? path.join((0, node_process_1.cwd)(), 'src', 'contracts', subPath, `${controllerName.toLowerCase()}.contract.ts`)
                : path.join((0, node_process_1.cwd)(), 'src', 'contracts', `${controllerName.toLowerCase()}.contract.ts`);
            if (fs.existsSync(contractPath))
                await fs.unlinkSync(contractPath);
            const contracts = core_1.Scope.getArray('__contracts');
            for (const contractStructure of contracts) {
                if (contractStructure.contractName === contractName)
                    await repository_1.RepositoryMigration.generateMigration(contractStructure, null);
            }
            const contractFiles = [
                path.join((0, node_process_1.cwd)(), 'src', 'controllers', subPath ? subPath : '', `${controllerName.toLowerCase()}.controller.ts`),
                path.join((0, node_process_1.cwd)(), '.generated', 'controllers', subPath ? subPath : '', `${controllerName.toLowerCase()}.controller.ts`),
                path.join((0, node_process_1.cwd)(), 'src', 'entities', subPath ? subPath : '', `${controllerName.toLowerCase()}.entity.ts`),
                path.join((0, node_process_1.cwd)(), '.generated', 'entities', subPath ? subPath : '', `${controllerName.toLowerCase()}.entity.ts`),
                path.join((0, node_process_1.cwd)(), 'src', 'gateways', subPath ? subPath : '', `${controllerName.toLowerCase()}.gateway.ts`),
                path.join((0, node_process_1.cwd)(), '.generated', 'gateways', subPath ? subPath : '', `${controllerName.toLowerCase()}.gateway.ts`),
                path.join((0, node_process_1.cwd)(), 'src', 'resolvers', subPath ? subPath : '', `${controllerName.toLowerCase()}.resolver.ts`),
                path.join((0, node_process_1.cwd)(), '.generated', 'resolvers', subPath ? subPath : '', `${controllerName.toLowerCase()}.resolver.ts`),
                path.join((0, node_process_1.cwd)(), 'src', 'models', subPath ? subPath : '', `${controllerName.toLowerCase()}.model.ts`),
                path.join((0, node_process_1.cwd)(), '.generated', 'models', subPath ? subPath : '', `${controllerName.toLowerCase()}.model.ts`),
                path.join((0, node_process_1.cwd)(), 'src', 'services', subPath ? subPath : '', `${controllerName.toLowerCase()}.service.ts`),
                path.join((0, node_process_1.cwd)(), '.generated', 'services', subPath ? subPath : '', `${controllerName.toLowerCase()}.service.ts`),
            ];
            contractFiles.forEach(async (file) => {
                if (fs.existsSync(file))
                    await fs.unlinkSync(file);
            });
        }
        return { success: true, message: 'Contract deleted successfully' };
    }
    /**
     * Restart the application
     * @returns The success and message of the operation
     */
    async restartApplication() {
        SandboxService_1.closeWebsocket();
        await core_1.Application.instance.restart();
        SandboxService_1.createWebsocket();
    }
};
exports.SandboxService = SandboxService;
SandboxService.logger = new core_1.Logger('Repository');
SandboxService.clients = [];
tslib_1.__decorate([
    (0, core_1.Hook)(core_1.HooksType.onHTTPServerInit),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], SandboxService.prototype, "definePublicDir", null);
exports.SandboxService = SandboxService = SandboxService_1 = tslib_1.__decorate([
    (0, core_1.Service)('sandbox')
], SandboxService);
