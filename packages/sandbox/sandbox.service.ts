import * as fs from 'node:fs';
import * as path from 'node:path';
import chokidar from 'chokidar';

const { WebSocketServer, WebSocket } = require('ws');

import { Logger, Service, Application } from '@cmmv/core';
import { cwd } from 'node:process';

@Service('sandbox')
export class SandboxService {
    public static logger: Logger = new Logger('Repository');

    public static async loadConfig(): Promise<void> {
        const httpServer = Application.instance.getUnderlyingHttpServer();
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

        chokidar
            .watch(['sandbox.client.cjs', 'sandbox.css', 'sandbox.html'], {
                persistent: true,
                ignoreInitial: true,
                cwd: __dirname,
            })
            .on('change', (filePath) => {
                broadcast({ event: 'change', filePath });
            })
            .on('unlink', (filePath) => {
                broadcast({ event: 'unlink', filePath });
            });
    }

    public resolveIndex() {
        return fs.readFileSync(path.join(__dirname, 'sandbox.html'), 'utf-8');
    }

    public async resolveClientJS() {
        return await fs.readFileSync(
            path.join(__dirname, 'sandbox.client.cjs'),
            'utf-8',
        );
    }

    public async resolveStyle() {
        return await fs.readFileSync(
            path.join(__dirname, 'sandbox.css'),
            'utf-8',
        );
    }

    public async resolveShema() {
        const schemaFilename = path.join(cwd(), '.generated', 'schema.json');
        return fs.existsSync(schemaFilename)
            ? JSON.parse(await fs.readFileSync(schemaFilename, 'utf-8'))
            : {};
    }
}
