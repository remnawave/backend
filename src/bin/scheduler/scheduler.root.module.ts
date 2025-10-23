import { createKeyv } from '@keyv/redis';
import { ClsModule } from 'nestjs-cls';

import { QueueModule } from 'src/queue/queue.module';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';

import { validateEnvConfig } from '@common/utils/validate-env-config';
import { PrismaService } from '@common/database/prisma.service';
import { configSchema, Env } from '@common/config/app-config';
import { PrismaModule } from '@common/database';
import { AxiosModule } from '@common/axios';

import { PrometheusReporterModule } from '@integration-modules/prometheus-reporter/prometheus-reporter.module';
import { MessagingModules } from '@integration-modules/messaging-modules';
import { HealthModule } from '@integration-modules/health/health.module';

import { RemnawaveModules } from '@modules/remnawave-backend.modules';

import { SchedulerModule } from '@scheduler/scheduler.module';

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
                        defaultTxOptions: {
                            timeout: 60_000,
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
        RemnawaveModules,
        PrometheusReporterModule,

        ScheduleModule.forRoot(),
        SchedulerModule,
        QueueModule,
        MessagingModules,
        HealthModule,
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
export class SchedulerRootModule implements OnApplicationShutdown {
    private readonly logger = new Logger(SchedulerRootModule.name);

    // async onModuleInit(): Promise<void> {
    //     segfaultHandler.registerHandler();

    //     this.logger.log('Segfault handler');

    //     // segfaultHandler.segfault();
    // }

    async onApplicationShutdown(signal?: string): Promise<void> {
        this.logger.log(`${signal} signal received, shutting down...`);
        if (signal === 'SIGSEGV') {
            process.exit(1);
        }
    }
}
