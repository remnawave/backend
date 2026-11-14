import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ClsModule } from 'nestjs-cls';
import { QueueModule } from 'src/queue/queue.module';

import { Logger, OnApplicationShutdown, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AxiosModule } from '@common/axios';
import { CommonConfigModule } from '@common/config/common-config';
import { PrismaModule } from '@common/database';
import { PrismaService } from '@common/database/prisma.service';
import { RawCacheModule } from '@common/raw-cache/raw-cache.module';
import { RequestAuthModule } from '@common/request-auth/request-auth.module';
import { RuntimeMetricsModule } from '@common/runtime-metrics/runtime-metrics.module';

import { RemnawaveModules } from '@modules/remnawave-backend.modules';

@Module({
    imports: [
        RawCacheModule,
        RequestAuthModule,
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
        }),
        EventEmitterModule.forRoot({
            wildcard: true,
            delimiter: '.',
        }),
        RemnawaveModules,
        QueueModule,
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
