import { Controller, Get, Response } from '@cmmv/http';

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
            await this.sandboxService.resolveClientJS(),
        );
    }

    @Get('graphql.js', { exclude: true })
    async handlerClientGraphQL(@Response() res) {
        res.contentType('text/javascript').send(
            await this.sandboxService.resolveClientGraphQL(),
        );
    }

    @Get('schema', { exclude: true })
    async handlerSchema() {
        return await this.sandboxService.resolveShema();
    }
}
