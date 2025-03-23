import * as path from 'node:path';
import * as fs from 'node:fs';
import { cwd } from 'node:process';

import {
    Controller,
    Get,
    Post,
    Response,
    Body,
    Delete,
    Param,
} from '@cmmv/http';

import { IContract } from '@cmmv/core';

import { SandboxService } from './sandbox.service';

@Controller('sandbox')
export class SanboxController {
    constructor(private readonly sandboxService: SandboxService) {}

    @Get({ exclude: true })
    async handlerIndex(@Response() res) {
        return res.render('sandbox', {
            wsPort: this.sandboxService.getWebSocketPort(),
        });
    }

    @Get('client.js', { exclude: true })
    async handlerClientJavascript(@Response() res) {
        res.contentType('text/javascript').send(
            await fs.readFileSync(
                path.join(
                    __dirname.replace('src', 'public'),
                    'sandbox.client.cjs',
                ),
                'utf-8',
            ),
        );
    }

    @Get('graphql.js', { exclude: true })
    async handlerClientGraphQL(@Response() res) {
        res.contentType('text/javascript').send(
            await fs.readFileSync(
                path.join(
                    __dirname.replace('src', 'public'),
                    'sandbox-graphql.client.cjs',
                ),
                'utf-8',
            ),
        );
    }

    @Get('datatable.js', { exclude: true })
    async handlerClientDataTable(@Response() res) {
        res.contentType('text/javascript').send(
            await fs.readFileSync(
                path.join(
                    __dirname.replace('src', 'public'),
                    'sandbox-datatable.client.cjs',
                ),
                'utf-8',
            ),
        );
    }

    @Get('logs.js', { exclude: true })
    async handlerLogs(@Response() res) {
        res.contentType('text/javascript').send(
            await fs.readFileSync(
                path.join(
                    __dirname.replace('src', 'public'),
                    'sandbox-logs.client.cjs',
                ),
                'utf-8',
            ),
        );
    }

    @Get('formbuilder.js', { exclude: true })
    async handlerFormBuilder(@Response() res) {
        res.contentType('text/javascript').send(
            await fs.readFileSync(
                path.join(
                    __dirname.replace('src', 'public'),
                    'sandbox-formbuilder.client.cjs',
                ),
                'utf-8',
            ),
        );
    }

    @Get('schema', { exclude: true })
    async handlerSchema() {
        const schemaFilename = path.join(cwd(), '.generated', 'schema.json');
        return fs.existsSync(schemaFilename)
            ? JSON.parse(await fs.readFileSync(schemaFilename, 'utf-8'))
            : {};
    }

    @Post('compile')
    async heandlerCompile(@Body() schema: IContract) {
        return await this.sandboxService.compileContract(schema);
    }

    @Delete(':contractName')
    async handlerDelete(@Param('contractName') contractName: string) {
        await this.sandboxService.deleteContract(contractName);
        return 'ok';
    }
}
