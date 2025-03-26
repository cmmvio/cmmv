"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewRegistry = void 0;
const path = require("node:path");
const fs = require("node:fs");
const fg = require('fast-glob');
const core_1 = require("@cmmv/core");
class ViewRegistry extends core_1.Singleton {
    constructor() {
        super(...arguments);
        this.styles = new Map();
    }
    static async load() {
        const directoryPackages = path.resolve(process.env.NODE_ENV === 'prod'
            ? './node_modules/@cmmv/**/*.style.json'
            : './packages/**/*.style.json');
        const directory = path.resolve(process.env.NODE_ENV === 'prod'
            ? './dist/**/*.style.json'
            : './src/**/*.style.json');
        const files = await fg([directoryPackages, directory, './public/**/*.style.json'], {
            ignore: ['node_modules/**'],
        });
        for await (const filename of files) {
            if (!filename.includes('node_modules')) {
                const style = fs.readFileSync(filename, 'utf-8');
                const name = path.basename(filename).replace('.style.json', '');
                this.register(name, JSON.parse(style));
            }
        }
    }
    static register(name, style) {
        const globalView = ViewRegistry.getInstance();
        globalView.styles.set(name, style);
    }
    static retrieve(key) {
        const globalView = ViewRegistry.getInstance();
        return globalView.styles.has(key) ? globalView.styles.get(key) : null;
    }
    static retrieveAll() {
        const globalView = ViewRegistry.getInstance();
        const stylesArr = Array.from(globalView.styles);
        const returnObj = {};
        for (const syle of stylesArr)
            returnObj[syle[0]] = syle[1];
        return returnObj;
    }
}
exports.ViewRegistry = ViewRegistry;
