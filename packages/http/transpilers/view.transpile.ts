import * as fs from 'node:fs';
import * as path from 'node:path';
import * as UglifyJS from 'uglify-js';
import { execSync } from 'node:child_process';

import { Config, ITranspile, Logger } from '@cmmv/core';

export class ViewTranspile implements ITranspile {
    private logger: Logger = new Logger('ViewTranspile');

    /**
     * Run the transpile
     */
    run(): void {
        const useRPCMiddleware = Config.get<boolean>(
            'rpc.injectMiddleware',
            false,
        );

        if (useRPCMiddleware) {
            const content = fs.readFileSync(
                path.resolve(__dirname, '../templates/cmmv.frontend.cjs'),
                'utf-8',
            );
            const outputDir = path.resolve('public/core');

            if (!fs.existsSync(outputDir))
                fs.mkdirSync(outputDir, { recursive: true });

            const outputFile = path.resolve('public/core/1-cmmv.min.cjs');
            const currentDate = new Date().toUTCString();
            const minifiedJsContent = UglifyJS.minify(content).code;
            fs.writeFileSync(
                outputFile,
                `/*!
     * cmmv.io (c) 2024, Andre Ferreira
     * compiled ${currentDate}
     * licensed under the MIT license
     * see: https://github.com/cmmvio/cmmv for details
     */\n ${minifiedJsContent}`,
                'utf8',
            );
        }
    }
}
