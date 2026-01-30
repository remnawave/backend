import { createKeyv } from '@keyv/redis';
import { ClsModule } from 'nestjs-cls';
import { join } from 'node:path';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import { Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CacheModule } from '@nestjs/cache-manager';

import { CommonConfigModule } from '@common/config/common-config/common-config.module';
import { disableFrontend } from '@common/utils/startup-app/is-development';
import { PrismaService } from '@common/database/prisma.service';
import { getRedisConnectionOptions } from '@common/utils';
import { AxiosModule } from '@common/axios/axios.module';
import { PrismaModule } from '@common/database';

import { IntegrationModules } from '@integration-modules/integration-modules';

import { RemnawaveModules } from '@modules/remnawave-backend.modules';

import { QueueModule } from '@queue/queue.module';

@Module({
    imports: [
        AxiosModule,
        CommonConfigModule,
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
                        rootPath: join(__dirname, '..', '..', 'frontend'),
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
                                ...getRedisConnectionOptions(
                                    configService.get<string>('REDIS_SOCKET'),
                                    configService.get<string>('REDIS_HOST'),
                                    configService.get<number>('REDIS_PORT'),
                                    'node-redis',
                                ),
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
export class AppModule implements OnApplicationShutdown {
    private readonly logger = new Logger(AppModule.name);

    async onApplicationShutdown(signal?: string): Promise<void> {
        this.logger.log(`${signal} signal received, shutting down...`);
    }
}
