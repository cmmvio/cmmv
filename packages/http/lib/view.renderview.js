"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMMVRenderer = void 0;
const fs = require("node:fs");
const core_1 = require("@cmmv/core");
const view_template_1 = require("./view.template");
const view_directives_1 = require("./view.directives");
class CMMVRenderer {
    constructor() {
        this.cache = new Map();
    }
    createNullProtoObjWherePossible() {
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
    shallowCopyFromList(to, from, list) {
        list = list || [];
        from = from || {};
        if (to !== null && to !== undefined) {
            for (let i = 0; i < list.length; i++) {
                const p = list[i];
                if (typeof from[p] !== 'undefined')
                    to[p] = from[p];
            }
        }
        return to;
    }
    handleCache(options, template) {
        let func;
        const filename = options.filename;
        const hasTemplate = arguments.length > 1;
        if (options.cache && filename) {
            func = this.cache.get(filename);
            if (func)
                return func;
        }
        if (!hasTemplate) {
            if (!filename)
                throw new Error('Internal CMMVRenderer error: no file name or template provided');
            template = fs.readFileSync(filename, 'utf-8');
        }
        func = this.compile(template, options);
        if (options.cache && filename)
            this.cache.set(filename, func);
        return func;
    }
    compile(template, opts) {
        const templ = new view_template_1.Template(template, opts);
        if (core_1.Config.get('view.vue3', false)) {
            templ.use([
                view_directives_1.ssrLoadData,
                view_directives_1.extractSetupScript,
                view_directives_1.sServerData,
                view_directives_1.sData,
                view_directives_1.sAttr,
                view_directives_1.i18n,
            ]); //Extact Setup first
            return templ.compile();
        }
        else {
            templ.use([
                view_directives_1.ssrLoadData,
                view_directives_1.extractSetupScript,
                view_directives_1.sServerData,
                view_directives_1.ssrDirectives,
                view_directives_1.sData,
                view_directives_1.sAttr,
                view_directives_1.i18n,
            ]); //Extact Setup first
            return templ.compile();
        }
    }
    async render(template, d, o) {
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
        }
        catch (err) {
            console.error('Error during rendering:', err);
            throw err;
        }
    }
    renderFile(filename, data, opts, cb) {
        opts = opts || {};
        opts.filename = filename;
        if (typeof cb !== 'function')
            throw new Error('Callback function is required');
        fs.readFile(filename, 'utf-8', async (err, content) => {
            if (err)
                return cb(err);
            try {
                const handle = this.handleCache(opts, content);
                const rendered = await handle(data);
                cb(null, rendered);
            }
            catch (err) {
                cb(err);
            }
        });
    }
    clearCache() {
        this.cache.clear();
    }
}
exports.CMMVRenderer = CMMVRenderer;
