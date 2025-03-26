"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationConfig = void 0;
exports.ApplicationConfig = {
    app: {
        telemetry: {
            required: false,
            type: 'boolean',
            default: true,
        },
        generatedDir: {
            required: false,
            type: 'string',
            default: '.generated',
        },
        sourceDir: {
            required: false,
            type: 'string',
            default: 'src',
        },
        generateSchema: {
            required: false,
            type: 'boolean',
            default: true,
        },
    },
};
