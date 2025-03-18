import { Controller, Get, Param, Res, Headers } from '@cmmv/http';

import { SandboxService } from './sandbox.service';

@Controller('sandbox')
export class SanboxController {
    constructor(private readonly sandboxService: SandboxService) {}

    @Get()
    async handlerIndex() {
        return this.sandboxService.resolveIndex();
    }

    @Get('client.js')
    async handlerClientJS(@Res() res) {
        res.contentType('text/javascript').send(
            await this.sandboxService.resolveClientJS(),
        );
    }

    @Get('style.css')
    async handlerStyle(@Res() res) {
        res.contentType('text/css').send(
            await this.sandboxService.resolveStyle(),
        );
    }

    @Get('schema')
    async handlerSchema() {
        return await this.sandboxService.resolveShema();
    }
}
