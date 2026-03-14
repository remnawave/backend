import { Module } from '@nestjs/common';

import { RuntimeMetricsService } from './runtime-metrics.service';

@Module({
    imports: [],
    providers: [RuntimeMetricsService],
    exports: [RuntimeMetricsService],
})
export class RuntimeMetricsModule {}
