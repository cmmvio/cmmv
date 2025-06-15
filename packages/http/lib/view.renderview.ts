import * as fs from 'node:fs';

import { Config } from '@cmmv/core';
import { Template } from './view.template';

import {
    sData,
    sAttr,
    i18n,
    extractSetupScript,
    sServerData,
    ssrDirectives,
    ssrLoadData,
} from './view.directives';

export class CMMVRenderer {
    private cache: Map<string, Function>;

    constructor() {
        this.cache = new Map();
    }

    /**
     * Create a null prototype object
     * @returns The null prototype object
     */
    private createNullProtoObjWherePossible() {
        if (typeof Object.create === 'function') {
            return function () {
                return Object.create(null);
            };
        }

        if (!({ __proto__: null } instanceof Object)) {
            return function () {
                return { __proto__: null };
            };
        }

        return function () {
            return {};
        };
    }

    /**
     * Shallow copy from list
     * @param to - The target object
     * @param from - The source object
     * @param list - The list of properties to copy
     * @returns The target object
     */
    private shallowCopyFromList(to: any, from: any, list: string[]) {
        list = list || [];
        from = from || {};

        if (to !== null && to !== undefined) {
            for (let i = 0; i < list.length; i++) {
                const p = list[i];

                if (typeof from[p] !== 'undefined') to[p] = from[p];
            }
        }

        return to;
    }

    /**
     * Handle the cache
     * @param options - The options
     * @param template - The template
     * @returns The function
     */
    private handleCache(options: any, template?: string) {
        let func: Function;
        const filename = options.filename;
        const hasTemplate = arguments.length > 1;

        if (options.cache && filename) {
            func = this.cache.get(filename);

            if (func) return func;
        }

        if (!hasTemplate) {
            if (!filename)
                throw new Error(
                    'Internal CMMVRenderer error: no file name or template provided',
                );

            template = fs.readFileSync(filename, 'utf-8');
        }

        func = this.compile(template, options);

        if (options.cache && filename) this.cache.set(filename, func);

        return func;
    }

    /**
     * Compile the template
     * @param template - The template
     * @param opts - The options
     * @returns The compiled template
     */
    public compile(template: string, opts: any) {
        const templ = new Template(template, opts);

        if (Config.get<boolean>('view.vue3', false)) {
            templ.use([
                ssrLoadData,
                extractSetupScript,
                sServerData,
                sData,
                sAttr,
                i18n,
            ]); //Extact Setup first

            return templ.compile();
        } else {
            templ.use([
                ssrLoadData,
                extractSetupScript,
                sServerData,
                ssrDirectives,
                sData,
                sAttr,
                i18n,
            ]); //Extact Setup first

            return templ.compile();
        }
    }

    /**
     * Render the template
     * @param template - The template
     * @param d - The data
     * @param o - The options
     * @returns The rendered template
     */
    public async render(template: string, d: any, o?: any) {
        const data = d || this.createNullProtoObjWherePossible();
        const opts = o || this.createNullProtoObjWherePossible();

        if (arguments.length === 2) {
            this.shallowCopyFromList(opts, data, [
                'delimiter',
                'scope',
                'context',
                'debug',
                'compileDebug',
                'client',
                '_with',
                'rmWhitespace',
                'strict',
                'filename',
                'async',
            ]);
        }

        try {
            const handle = await this.handleCache(opts, template);
            return handle(data);
        } catch (err) {
            console.error('Error during rendering:', err);
            throw err;
        }
    }

    /**
     * Render the file
     * @param filename - The filename
     * @param data - The data
     * @param opts - The options
     * @param cb - The callback function
     */
    public renderFile(filename: string, data: any, opts: any, cb: Function) {
        opts = opts || {};
        opts.filename = filename;

        if (typeof cb !== 'function')
            throw new Error('Callback function is required');

        fs.readFile(filename, 'utf-8', async (err, content) => {
            if (err) return cb(err);

            try {
                const handle = this.handleCache(opts, content);
                const rendered = await handle(data);
                cb(null, rendered);
            } catch (err) {
                cb(err);
            }
        });
    }

    /**
     * Clear the cache
     */
    public clearCache() {
        this.cache.clear();
    }
}
