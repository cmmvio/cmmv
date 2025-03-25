import * as fs from 'node:fs';
import * as path from 'node:path';

import { Config } from '@cmmv/core';
import { Controller, Get, Res } from '@cmmv/http';

@Controller('docs')
export class OpenAPIController {
    @Get('/openapi.json', { exclude: true })
    async getOpenAPISpec(@Res() res): Promise<void> {
        const openAPIPath = path.resolve(
            __dirname,
            '../../../public/openapi.json',
        );
        res.type('application/json').send(
            fs.readFileSync(openAPIPath, 'utf-8'),
        );
    }

    @Get('/openapi.yml', { exclude: true })
    async getOpenAPISpecYML(@Res() res): Promise<void> {
        const openAPIPath = path.resolve(
            __dirname,
            '../../../public/openapi.yml',
        );
        res.type('text/yaml').send(fs.readFileSync(openAPIPath, 'utf-8'));
    }

    @Get({ exclude: true })
    async handlerIndexDocs() {
        const title = Config.get('openapi.info.title');

        const openAPIHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.3/swagger-ui.css" />
            </head>
            <body>
                <div id="openapi-ui"></div>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.3/swagger-ui-bundle.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.3/swagger-ui-standalone-preset.js"></script>
                <script>
                    const ui = SwaggerUIBundle({
                        url: '/docs/openapi.json',
                        dom_id: '#openapi-ui',
                        presets: [
                            SwaggerUIBundle.presets.apis,
                            SwaggerUIBundle.SwaggerUIStandalonePreset
                        ],
                    });
                </script>
            </body>
            </html>
        `;

        return openAPIHtml;
    }
}
