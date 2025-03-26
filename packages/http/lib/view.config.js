"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewConfig = void 0;
exports.ViewConfig = {
    i18n: {
        localeFiles: {
            required: false,
            type: 'string',
            default: './src/locale',
        },
        default: {
            required: false,
            type: 'string',
            default: 'en',
        },
    },
    view: {
        extractInlineScript: {
            required: false,
            type: 'boolean',
            default: false,
        },
        minifyHTML: {
            required: false,
            type: 'boolean',
            default: true,
        },
        scriptsTimestamp: {
            required: false,
            type: 'boolean',
            default: false,
        },
    },
};
