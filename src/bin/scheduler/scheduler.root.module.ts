import { ClsModule } from 'nestjs-cls';

import { QueueModule } from 'src/queue/queue.module';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { RuntimeMetricsModule } from '@common/runtime-metrics/runtime-metrics.module';
import { RawCacheModule } from '@common/raw-cache/raw-cache.module';
import { CommonConfigModule } from '@common/config/common-config';
import { PrismaService } from '@common/database/prisma.service';
import { PrismaModule } from '@common/database';
import { AxiosModule } from '@common/axios';

import { PrometheusReporterModule } from '@integration-modules/prometheus-reporter/prometheus-reporter.module';
import { HealthModule } from '@integration-modules/health/health.module';

import { RemnawaveModules } from '@modules/remnawave-backend.modules';

import { SchedulerModule } from '@scheduler/scheduler.module';

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
        HealthModule,
        RuntimeMetricsModule,
    ],
})
export class SchedulerRootModule implements OnApplicationShutdown {
    private readonly logger = new Logger(SchedulerRootModule.name);

    async onApplicationShutdown(signal?: string): Promise<void> {
        this.logger.log(`${signal} signal received, shutting down...`);
        if (signal === 'SIGSEGV') {
            process.exit(1);
        }
    }
}
