import { defineConfig } from 'vitest/config';

import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            'fast-json-stringify': require.resolve('fast-json-stringify'),
            'fast-glob': require.resolve('fast-glob'),
            '@cmmv/auth': path.resolve(__dirname, 'packages/auth'),
            '@cmmv/cache': path.resolve(__dirname, 'packages/cache'),
            '@cmmv/core': path.resolve(__dirname, 'packages/core'),
            '@cmmv/http': path.resolve(__dirname, 'packages/http'),
            '@cmmv/protobuf': path.resolve(__dirname, 'packages/protobuf'),
            '@cmmv/repository': path.resolve(__dirname, 'packages/repository'),
            '@cmmv/testing': path.resolve(__dirname, 'packages/testing'),
            '@cmmv/vault': path.resolve(__dirname, 'packages/vault'),
            '@cmmv/ws': path.resolve(__dirname, 'packages/ws'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['reflect-metadata', 'fast-json-stringify', 'fast-glob'],
        env: {
            NODE_ENV: 'test',
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            include: [
                'packages/*/lib/**/*.ts',
                'packages/*/services/**/*.ts',
                'packages/*/managers/**/*.ts',
                'packages/*/adapters/**/*.ts',
                'packages/*/decorators/**/*.ts',
                'packages/*/registries/**/*.ts',
                'packages/*/abstracts/**/*.ts',
                'packages/*/transpilers/**/*.ts',
                'packages/*/utils/**/*.ts',
                'packages/*/interfaces/**/*.ts',
                'packages/*/controllers/**/*.ts',
                'packages/*/contracts/**/*.ts',
                'packages/core/application.ts',
            ],
            exclude: [
                'node_modules/',
                'dist/',
                '.generated/',
                '**/*.spec.ts',
                '**/*.test.ts',
                '**/*.mock.ts',
                '**/test/**',
                '**/tests/**',
                '**/*.config.ts',
                '**/*.config.js',
                '**/tsconfig.*.json',
                '**/*.d.ts',
                '**/*.js',
            ],
            all: true,
            lines: 80,
            functions: 80,
            branches: 70,
            statements: 80,
        },
    },
});
