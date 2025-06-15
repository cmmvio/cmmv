import * as path from 'node:path';
import * as fs from 'node:fs';
const fg = require('fast-glob');

import { Singleton } from '@cmmv/core';

export class ViewRegistry extends Singleton {
    public styles: Map<string, any> = new Map<string, any>();

    /**
     * Load the styles
     */
    static async load() {
        const directoryPackages = path.resolve(
            process.env.NODE_ENV === 'prod'
                ? './node_modules/@cmmv/**/*.style.json'
                : './packages/**/*.style.json',
        );

        const directory = path.resolve(
            process.env.NODE_ENV === 'prod'
                ? './dist/**/*.style.json'
                : './src/**/*.style.json',
        );

        const files = await fg(
            [directoryPackages, directory, './public/**/*.style.json'],
            {
                ignore: ['node_modules/**'],
            },
        );

        for await (const filename of files) {
            if (!filename.includes('node_modules')) {
                const style = fs.readFileSync(filename, 'utf-8');
                const name = path.basename(filename).replace('.style.json', '');
                this.register(name, JSON.parse(style));
            }
        }
    }

    /**
     * Register a style
     * @param name - The name
     * @param style - The style
     */
    static register(name: string, style: any): void {
        const globalView = ViewRegistry.getInstance();
        globalView.styles.set(name, style);
    }

    /**
     * Retrieve a style
     * @param key - The key
     * @returns The style
     */
    static retrieve(key: string): any | null {
        const globalView = ViewRegistry.getInstance();
        return globalView.styles.has(key) ? globalView.styles.get(key) : null;
    }

    /**
     * Retrieve all styles
     * @returns The styles
     */
    static retrieveAll(): object {
        const globalView = ViewRegistry.getInstance();
        const stylesArr = Array.from(globalView.styles);
        const returnObj = {};

        for (const syle of stylesArr) returnObj[syle[0]] = syle[1];

        return returnObj;
    }
}
