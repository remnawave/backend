// @ts-check
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import path from 'node:path';
import { RunScriptWebpackPlugin } from 'run-script-webpack-plugin';
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin';
import nodeExternals from 'webpack-node-externals';

const isDev = process.env.NODE_ENV !== 'production';
const isGenDoc = process.env.BUILD_GEN_DOC === '1';
const isSeed = process.env.BUILD_SEED === '1';

/**
 * @typedef {'api' | 'processor' | 'scheduler'} InstanceKey
 * @typedef {{ name: string, src: string }} InstanceDef
 */

/** @type {Record<InstanceKey, InstanceDef>} */
const INSTANCES = {
    api: { name: 'app', src: './src/main.ts' },
    processor: { name: 'processors', src: './src/bin/processors/processors.ts' },
    scheduler: { name: 'scheduler', src: './src/bin/scheduler/scheduler.ts' },
};

/** @type {InstanceKey} */
const DEV_INSTANCE = /** @type {InstanceKey} */ (process.env.INSTANCE_TYPE ?? 'api');

/**
 * @returns {import('@rspack/core').EntryObject}
 */
function buildEntry() {
    if (isSeed) {
        return { seed: './prisma/seed/config.seed.ts' };
    }

    if (isGenDoc) {
        return { 'gen-doc': './src/bin/gen-doc/gen-doc.ts' };
    }
    if (isDev) {
        const inst = INSTANCES[DEV_INSTANCE];
        if (!inst) {
            throw new Error(
                `Unknown INSTANCE_TYPE="${DEV_INSTANCE}". ` +
                    `Expected one of: ${Object.keys(INSTANCES).join(', ')}`,
            );
        }
        return { [inst.name]: ['@rspack/core/hot/poll?100', inst.src] };
    }
    return {
        app: './src/main.ts',
        processors: './src/bin/processors/processors.ts',
        scheduler: './src/bin/scheduler/scheduler.ts',
        cli: './src/bin/cli/cli.ts',
        seed: './prisma/seed/config.seed.ts',
    };
}

const devRunName = isDev && !isGenDoc ? `${INSTANCES[DEV_INSTANCE].name}.js` : null;

export default defineConfig({
    context: import.meta.dirname,
    target: 'node',
    entry: buildEntry(),
    output: {
        clean: true,
        filename: '[name].js',
    },
    resolve: {
        extensions: ['...', '.ts', '.tsx', '.jsx'],
        tsConfig: path.resolve(import.meta.dirname, './tsconfig.json'),
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'builtin:swc-loader',
                    options: {
                        detectSyntax: 'auto',
                        jsc: {
                            parser: { decorators: true },
                            transform: {
                                legacyDecorator: true,
                                decoratorMetadata: true,
                                useDefineForClassFields: true,
                            },
                        },
                    },
                },
            },
        ],
    },
    devtool: isGenDoc ? false : undefined,
    optimization: {
        minimize: isGenDoc ? false : undefined,
        runtimeChunk: false,
        splitChunks: false,
        minimizer: [
            new rspack.SwcJsMinimizerRspackPlugin({
                minimizerOptions: {
                    compress: { keep_classnames: true, keep_fnames: true },
                    mangle: { keep_classnames: true, keep_fnames: true },
                },
            }),
        ],
    },
    externalsType: 'commonjs',
    externals: [
        nodeExternals({
            allowlist: [/@rspack\/core\/hot\/poll/],
        }),
    ],
    plugins: [
        ...(devRunName
            ? [
                  new RunScriptWebpackPlugin({ name: devRunName, autoRestart: false }),
                  new rspack.HotModuleReplacementPlugin(),
              ]
            : []),
        ...(isDev
            ? []
            : [
                  new rspack.BannerPlugin({
                      banner: '#!/usr/bin/env node',
                      raw: true,
                      entryOnly: true,
                      include: /cli\.js$/,
                  }),
              ]),
        ...(isGenDoc
            ? [
                  new rspack.BannerPlugin({
                      banner: [
                          "process.env.DATABASE_URL ??= 'postgresql://openapi:openapi@openapi:5432/openapi';",
                          "process.env.APP_SECRET ??= 'openapi';",
                          "process.env.FRONT_END_DOMAIN ??= 'openapi';",
                          "process.env.SUB_PUBLIC_DOMAIN ??= 'openapi';",
                          "process.env.METRICS_USER ??= 'openapi';",
                          "process.env.METRICS_PASS ??= 'openapi';",
                          "process.env.REDIS_HOST ??= 'localhost';",
                          "process.env.REDIS_PORT ??= '6379';",
                          "process.env.INSTANCE_TYPE ??= 'api';",
                      ].join('\n'),
                      raw: true,
                      entryOnly: true,
                      include: /gen-doc\.js$/,
                  }),
              ]
            : [
                  new TsCheckerRspackPlugin({
                      typescript: {
                          configFile: path.resolve(import.meta.dirname, './tsconfig.json'),
                          mode: 'readonly',
                          build: false,
                      },
                  }),
              ]),
    ],
});
