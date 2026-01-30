import typescriptEslintEslintPlugin from '@typescript-eslint/eslint-plugin';
import perfectionist from 'eslint-plugin-perfectionist';
import tsParser from '@typescript-eslint/parser';
import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
import paths from 'eslint-plugin-paths';
import globals from 'globals';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
});

export default [
    {
        ignores: ['**/.eslintrc.js', 'prisma/**/*', '.hygen.js', '.hygen/**/*'],
    },
    ...compat.extends('plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'),
    perfectionist.configs['recommended-alphabetical'],
    {
        plugins: {
            '@typescript-eslint': typescriptEslintEslintPlugin,
            paths,
        },

        languageOptions: {
            globals: {
                ...globals.node,
            },

            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'commonjs',

            parserOptions: {
                project: 'tsconfig.json',
                tsconfigRootDir: __dirname,
            },
        },

        rules: {
            'perfectionist/sort-imports': [
                'error',
                {
                    type: 'line-length',
                    order: 'desc',
                    ignoreCase: true,
                    specialCharacters: 'keep',
                    internalPattern: ['^~/.+'],
                    tsconfigRootDir: '.',
                    partitionByComment: false,
                    partitionByNewLine: false,
                    newlinesBetween: 'always',
                    maxLineLength: undefined,
                    tsconfigRootDir: __dirname,

                    groups: [
                        'type',
                        ['builtin', 'external'],
                        'internal-type',
                        'internal',
                        'nestJs',
                        'remnawave',
                        'aliasCommon',
                        { newlinesBetween: 'never' },
                        'aliasLibs',
                        'aliasIntegrationModules',
                        'aliasModules',
                        'aliasScheduler',
                        'aliasQueue',
                        ['parent-type', 'sibling-type', 'index-type'],
                        ['parent', 'sibling', 'index'],
                        'object',
                        'unknown',
                    ],

                    customGroups: {
                        value: {
                            aliasModules: '@modules/*.',
                            aliasCommon: '@common/*.',
                            aliasLibs: '@libs/*.',
                            aliasIntegrationModules: '@integration-modules/*.',
                            aliasScheduler: '@scheduler/*.',
                            aliasQueue: '@queue/*.',
                            remnawave: '@remnawave/*.',
                            nestJs: '@nestjs/*.',
                            generated: '@generated/*.',
                        },
                    },

                    environment: 'node',
                },
            ],
            'perfectionist/sort-decorators': [
                'error',
                {
                    groups: ['unknown', 'httpCodes', 'filters', 'controllers', 'nestJSMethods'],

                    customGroups: {
                        httpCodes: ['HttpCode'],
                        filters: ['UseFilters'],
                        controllers: ['Controller'],
                        nestJSMethods: ['Post', 'Get', 'Put', 'Delete', 'Patch', 'Options', 'Head'],
                    },
                },
            ],

            'perfectionist/sort-objects': ['off'],
            'perfectionist/sort-classes': ['off'],
            'perfectionist/sort-switch-case': ['off'],
            'perfectionist/sort-object-types': ['off'],
            'perfectionist/sort-interfaces': ['off'],
            'perfectionist/sort-union-types': ['off'],
            'perfectionist/sort-named-imports': ['off'],
            'perfectionist/sort-modules': ['off'],
            'paths/alias': 'error',
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-namespace': 'off',
            'linebreak-style': 0,
            'no-console': 'warn',

            'prettier/prettier': [
                'error',
                {
                    bracketSpacing: true,
                    tabWidth: 4,
                    printWidth: 100,
                    singleQuote: true,
                    trailingComma: 'all',

                    overrides: [
                        {
                            files: ['*.js', '*.jsx', '*.ts', '*.tsx'],

                            options: {
                                parser: 'typescript',
                            },
                        },
                        {
                            files: ['*.md', '*.json', '*.yaml', '*.yml'],

                            options: {
                                tabWidth: 2,
                            },
                        },
                    ],
                },
            ],
        },
    },
];
