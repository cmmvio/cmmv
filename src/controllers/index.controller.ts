import {
    Controller,
    Request,
    Response,
    Get,
    Redirect,
    HttpCode,
} from '@cmmv/http';

import { ServiceRegistry } from '@cmmv/core';

@Controller()
export class IndexController {
    @Get({ exclude: true })
    async renderIndex(@Request() req, @Response() res) {
        res.render('index', {
            nonce: res.locals.nonce,
            services: ServiceRegistry.getServicesArr(),
            requestId: req.requestId,
        });
    }
}
