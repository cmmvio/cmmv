import { ConfigSchema } from './interfaces/config-shema.interface';

export const ApplicationConfig: ConfigSchema = {
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
