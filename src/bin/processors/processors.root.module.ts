import { RedisModule, RedisModuleOptions } from '@songkeys/nestjs-redis';
import { createKeyv } from '@keyv/redis';
import { ClsModule } from 'nestjs-cls';

import { QueueModule } from 'src/queue/queue.module';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Logger, OnApplicationShutdown, Module } from '@nestjs/common';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';

import { validateEnvConfig } from '@common/utils/validate-env-config';
import { PrismaService } from '@common/database/prisma.service';
import { configSchema, Env } from '@common/config/app-config';
import { getRedisConnectionOptions } from '@common/utils';
import { PrismaModule } from '@common/database';
import { AxiosModule } from '@common/axios';

import { MessagingModules } from '@integration-modules/messaging-modules';

import { RemnawaveModules } from '@modules/remnawave-backend.modules';

@Module({
    imports: [
        AxiosModule,
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
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
                        defaultTxOptions: {
                            maxWait: 20_000,
                            timeout: 120_000,
                        },
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

        RedisModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService): Promise<RedisModuleOptions> => {
                return {
                    config: {
                        ...getRedisConnectionOptions(
                            configService.get<string>('REDIS_SOCKET'),
                            configService.get<string>('REDIS_HOST'),
                            configService.get<number>('REDIS_PORT'),
                            'ioredis',
                        ),
                        db: configService.getOrThrow<number>('REDIS_DB'),
                        password: configService.get<string | undefined>('REDIS_PASSWORD'),
                        keyPrefix: 'ioraw:',
                    },
                } satisfies RedisModuleOptions;
            },
            inject: [ConfigService],
        }),

        RemnawaveModules,
        QueueModule,
        MessagingModules,
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
    controllers: [],
})
export class ProcessorsRootModule implements OnApplicationShutdown {
    private readonly logger = new Logger(ProcessorsRootModule.name);

    async onApplicationShutdown(signal?: string): Promise<void> {
        this.logger.log(`${signal} signal received, shutting down...`);
        if (signal === 'SIGSEGV') {
            process.exit(1);
        }
    }
}
