const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            '.generated/**',
            '**/*.js',
            '**/*.cjs',
            '**/*.mjs',
            '**/*.d.ts',
            '**/tsconfig.*.json',
            'coverage/**',
            'public/**',
        ],
    },
    {
        files: ['packages/**/*.ts', 'src/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2020,
                project: './tsconfig.json',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                    experimentalObjectRestSpread: true,
                },
            },
            globals: {
                node: true,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-array-constructor': 'off',
            '@typescript-eslint/no-restricted-syntax': 'off',
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
        },
    },
    {
        files: ['packages/**/*.spec.ts', 'integration/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.spec.json',
                sourceType: 'module',
            },
            globals: {
                node: true,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-restricted-syntax': 'off',
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/no-this-alias': 'off',
        },
    },
];

