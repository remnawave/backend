import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { PrometheusReporterModule } from '@integration-modules/prometheus-reporter/prometheus-reporter.module';

import { JOBS_SERVICES, MESSAGE_HANDLERS } from './tasks';
import { METRIC_PROVIDERS } from './metrics-providers';
import { ENQUEUE_SERVICES } from './enqueue';
import { EVENT_LISTENERS } from './events';

@Module({
    imports: [CqrsModule, PrometheusReporterModule],
    providers: [
        ...ENQUEUE_SERVICES,
        ...JOBS_SERVICES,
        ...METRIC_PROVIDERS,
        ...MESSAGE_HANDLERS,
        ...EVENT_LISTENERS,
    ],
})
export class SchedulerModule {}
