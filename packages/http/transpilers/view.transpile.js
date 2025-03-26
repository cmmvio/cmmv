"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewTranspile = void 0;
const fs = require("node:fs");
const path = require("node:path");
const UglifyJS = require("uglify-js");
const core_1 = require("@cmmv/core");
class ViewTranspile {
    constructor() {
        this.logger = new core_1.Logger('ViewTranspile');
    }
    run() {
        const useRPCMiddleware = core_1.Config.get('rpc.injectMiddleware', false);
        if (useRPCMiddleware) {
            const content = fs.readFileSync(path.resolve(__dirname, '../templates/cmmv.frontend.cjs'), 'utf-8');
            const outputDir = path.resolve('public/core');
            if (!fs.existsSync(outputDir))
                fs.mkdirSync(outputDir, { recursive: true });
            const outputFile = path.resolve('public/core/1-cmmv.min.cjs');
            const currentDate = new Date().toUTCString();
            const minifiedJsContent = UglifyJS.minify(content).code;
            fs.writeFileSync(outputFile, `/*!
     * cmmv.io (c) 2024, Andre Ferreira
     * compiled ${currentDate}
     * licensed under the MIT license
     * see: https://github.com/cmmvio/cmmv for details
     */\n ${minifiedJsContent}`, 'utf8');
        }
    }
}
exports.ViewTranspile = ViewTranspile;
