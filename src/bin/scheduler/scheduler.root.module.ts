import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ClsModule } from 'nestjs-cls';
import { QueueModule } from 'src/queue/queue.module';

import { Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { CommonConfigModule } from '@common/config/common-config';
import { PrismaModule } from '@common/database';
import { PrismaService } from '@common/database/prisma.service';
import { RawCacheModule } from '@common/raw-cache/raw-cache.module';
import { RequestAuthModule } from '@common/request-auth/request-auth.module';
import { RuntimeMetricsModule } from '@common/runtime-metrics/runtime-metrics.module';

import { HealthModule } from '@integration-modules/health/health.module';
import { PrometheusReporterModule } from '@integration-modules/prometheus-reporter/prometheus-reporter.module';

import { RemnawaveModules } from '@modules/remnawave-backend.modules';

import { SchedulerModule } from '@scheduler/scheduler.module';

@Module({
    imports: [
        RawCacheModule,
        RequestAuthModule,
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
