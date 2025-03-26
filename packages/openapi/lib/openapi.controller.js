"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPIController = void 0;
const tslib_1 = require("tslib");
const fs = require("node:fs");
const path = require("node:path");
const core_1 = require("@cmmv/core");
const http_1 = require("@cmmv/http");
let OpenAPIController = class OpenAPIController {
    async getOpenAPISpec(res) {
        const openAPIPath = path.resolve(__dirname, '../../../public/openapi.json');
        res.type('application/json').send(fs.readFileSync(openAPIPath, 'utf-8'));
    }
    async getOpenAPISpecYML(res) {
        const openAPIPath = path.resolve(__dirname, '../../../public/openapi.yml');
        res.type('text/yaml').send(fs.readFileSync(openAPIPath, 'utf-8'));
    }
    async handlerIndexDocs() {
        const title = core_1.Config.get('openapi.info.title');
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
};
exports.OpenAPIController = OpenAPIController;
tslib_1.__decorate([
    (0, http_1.Get)('/openapi.json', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Res)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], OpenAPIController.prototype, "getOpenAPISpec", null);
tslib_1.__decorate([
    (0, http_1.Get)('/openapi.yml', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Res)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], OpenAPIController.prototype, "getOpenAPISpecYML", null);
tslib_1.__decorate([
    (0, http_1.Get)({ exclude: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], OpenAPIController.prototype, "handlerIndexDocs", null);
exports.OpenAPIController = OpenAPIController = tslib_1.__decorate([
    (0, http_1.Controller)('docs')
], OpenAPIController);
