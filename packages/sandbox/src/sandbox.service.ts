import * as fs from 'node:fs';
import * as path from 'node:path';
import chokidar from 'chokidar';

const { WebSocketServer, WebSocket } = require('ws');

import { Logger, Service, Application, Hook, HooksType } from '@cmmv/core';

import { cwd } from 'node:process';

@Service('sandbox')
export class SandboxService {
    public static logger: Logger = new Logger('Repository');

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

        chokidar
            .watch(
                [
                    './public/sandbox.client.cjs',
                    './public/sandbox.css',
                    './public/*.html',
                ],
                {
                    persistent: true,
                    ignoreInitial: true,
                    cwd: __dirname.replace('/src', ''),
                },
            )
            .on('change', (filePath) => {
                this.logger.verbose(`File change ${filePath}`);
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
            path.join(__dirname.replace('src', 'public'), 'sandbox.client.cjs'),
            'utf-8',
        );
    }

    public async resolveStyle() {
        return await fs.readFileSync(
            path.join(__dirname.replace('src', 'public'), 'sandbox.css'),
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
