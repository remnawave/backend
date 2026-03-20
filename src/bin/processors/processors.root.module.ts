import { ClsModule } from 'nestjs-cls';

import { QueueModule } from 'src/queue/queue.module';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Logger, OnApplicationShutdown, Module } from '@nestjs/common';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConditionalModule } from '@nestjs/config';

import { RuntimeMetricsModule } from '@common/runtime-metrics/runtime-metrics.module';
import { RawCacheModule } from '@common/raw-cache/raw-cache.module';
import { CommonConfigModule } from '@common/config/common-config';
import { PrismaService } from '@common/database/prisma.service';
import { RedisProducerModule } from '@common/microservices';
import { isProcessor } from '@common/utils/startup-app';
import { PrismaModule } from '@common/database';
import { AxiosModule } from '@common/axios';

import { RemnawaveModules } from '@modules/remnawave-backend.modules';

@Module({
    imports: [
        RawCacheModule,
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
        RemnawaveModules,
        QueueModule,
        ConditionalModule.registerWhen(RedisProducerModule, () => isProcessor()),
        RuntimeMetricsModule,
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
