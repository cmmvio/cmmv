import { ConfigSchema } from '@cmmv/core';

export const ViewConfig: ConfigSchema = {
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
