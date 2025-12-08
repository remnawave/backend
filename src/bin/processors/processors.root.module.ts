import { RedisModule, RedisModuleOptions } from '@songkeys/nestjs-redis';
import { createKeyv } from '@keyv/redis';
import { ClsModule } from 'nestjs-cls';

import { QueueModule } from 'src/queue/queue.module';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import { Logger, OnApplicationShutdown, Module } from '@nestjs/common';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';

import { CommonConfigModule } from '@common/config/common-config';
import { PrismaService } from '@common/database/prisma.service';
import { RedisProducerModule } from '@common/microservices';
import { getRedisConnectionOptions } from '@common/utils';
import { isProcessor } from '@common/utils/startup-app';
import { PrismaModule } from '@common/database';
import { AxiosModule } from '@common/axios';

import { RemnawaveModules } from '@modules/remnawave-backend.modules';

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
        ConditionalModule.registerWhen(RedisProducerModule, () => isProcessor()),
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
