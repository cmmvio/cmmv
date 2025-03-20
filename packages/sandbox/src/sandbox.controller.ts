import * as path from 'node:path';
import * as fs from 'node:fs';
import { cwd } from 'node:process';

import { Controller, Get, Post, Response, Body } from '@cmmv/http';

import { Compile, IContract } from '@cmmv/core';

import { SandboxService } from './sandbox.service';

@Controller('sandbox')
export class SanboxController {
    constructor(private readonly sandboxService: SandboxService) {}

    @Get({ exclude: true })
    async handlerIndex(@Response() res) {
        return res.render('sandbox');
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

    @Get('schema', { exclude: true })
    async handlerSchema() {
        const schemaFilename = path.join(cwd(), '.generated', 'schema.json');
        return fs.existsSync(schemaFilename)
            ? JSON.parse(await fs.readFileSync(schemaFilename, 'utf-8'))
            : {};
    }

    @Post('compile')
    async heandlerCompile(@Body() schema: IContract) {
        const filanameRaw = schema.contractName
            .toLowerCase()
            .replace('contract', '.contract');
        const schemaFilename = path.join(
            cwd(),
            'src',
            'contract',
            filanameRaw + '.ts',
        );
        Compile.getInstance().compileSchema(schema, schemaFilename);
        return 'ok';
    }

    /*@Post('generate')
    async handlerGenerate(@Body() prompt: string) {
        return await this.sandboxService.generateContractFromAI(prompt);
    }*/
}
