import { createKeyv } from '@keyv/redis';
import { ClsModule } from 'nestjs-cls';
import { join } from 'node:path';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';

import { disableFrontend, isCrowdinEditorEnabled } from '@common/utils/startup-app/is-development';
import { validateEnvConfig } from '@common/utils/validate-env-config';
import { PrismaService } from '@common/database/prisma.service';
import { configSchema, Env } from '@common/config/app-config';
import { AxiosModule } from '@common/axios/axios.module';
import { PrismaModule } from '@common/database';

import { IntegrationModules } from '@integration-modules/integration-modules';

import { RemnawaveModules } from '@modules/remnawave-backend.modules';

import { QueueModule } from '@queue/queue.module';

@Module({
    imports: [
        AxiosModule,
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            validate: (config) => validateEnvConfig<Env>(configSchema, config),
        }),
        PrismaModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [PrismaModule],
                    adapter: new TransactionalAdapterPrisma({
                        prismaInjectionToken: PrismaService,
                    }),
                }),
            ],
            global: true,
            middleware: { mount: true },
        }),
        EventEmitterModule.forRoot({
            wildcard: true,
            delimiter: '.',
        }),

        IntegrationModules,
        RemnawaveModules,
        ConditionalModule.registerWhen(
            ServeStaticModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => [
                    {
                        rootPath: join(
                            __dirname,
                            '..',
                            '..',
                            isCrowdinEditorEnabled() ? 'frontend-crowdin' : 'frontend',
                        ),
                        renderPath: '*splat',
                        exclude: [
                            '/api/*splat',
                            configService.getOrThrow<string>('SWAGGER_PATH'),
                            configService.getOrThrow<string>('SCALAR_PATH'),
                        ],
                        serveStaticOptions: {
                            dotfiles: 'ignore',
                        },
                    },
                ],
            }),
            () => !disableFrontend(),
        ),

        QueueModule,
        CacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            isGlobal: true,
            useFactory: async (configService: ConfigService) => {
                return {
                    stores: [
                        createKeyv(
                            {
                                url: `redis://${configService.getOrThrow<string>('REDIS_HOST')}:${configService.getOrThrow<number>('REDIS_PORT')}`,
                                database: configService.getOrThrow<number>('REDIS_DB'),
                                password: configService.get<string | undefined>('REDIS_PASSWORD'),
                            },
                            {
                                namespace: 'rmnwv',
                                keyPrefixSeparator: ':',
                            },
                        ),
                    ],
                };
            },
        }),
    ],
})
export class AppModule {}
