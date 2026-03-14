import { monitorEventLoopDelay, IntervalHistogram } from 'node:perf_hooks';
import { InjectRedis } from '@songkeys/nestjs-redis';
import process from 'node:process';
import Redis from 'ioredis';

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

import { INTERNAL_CACHE_KEYS } from '@libs/contracts/constants';

import { RuntimeMetric } from './interfaces';

@Injectable()
export class RuntimeMetricsService implements OnModuleDestroy, OnModuleInit {
    private readonly logger = new Logger(RuntimeMetricsService.name);

    private readonly INSTANCE_ID: string;
    private readonly INSTANCE_TYPE: string;
    private readonly INTERVAL_MS = 5_000;
    private readonly CACHE_KEY = INTERNAL_CACHE_KEYS.RUNTIME_METRICS;

    private timer: NodeJS.Timeout | null = null;
    private eld: IntervalHistogram;

    constructor(@InjectRedis() private readonly redis: Redis) {
        this.INSTANCE_ID = process.env.INSTANCE_ID || '0';
        this.INSTANCE_TYPE = process.env.INSTANCE_TYPE || 'api';
        this.eld = monitorEventLoopDelay({ resolution: 20 });
    }

    onModuleInit(): void {
        this.eld.enable();
        this.timer = setInterval(() => {
            void this.report();
        }, this.INTERVAL_MS);

        void this.report();
        this.logger.log(`Metrics reporter started [${this.INSTANCE_TYPE}-${this.INSTANCE_ID}]`);
    }

    onModuleDestroy(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.eld.disable();
    }

    private collect(): RuntimeMetric {
        const mem = process.memoryUsage();

        return {
            rss: mem.rss,
            heapUsed: mem.heapUsed,
            heapTotal: mem.heapTotal,
            external: mem.external,
            arrayBuffers: mem.arrayBuffers,
            eventLoopDelayMs: this.eld.mean / 1e6 || 0,
            eventLoopP99Ms: this.eld.percentile(99) / 1e6,
            activeHandles: process.getActiveResourcesInfo().length,
            uptime: process.uptime(),
            pid: process.pid,
            timestamp: Date.now(),
            instanceId: this.INSTANCE_ID,
            instanceType: this.INSTANCE_TYPE,
        };
    }

    private async report(): Promise<void> {
        try {
            const metrics = this.collect();

            await this.redis.hset(
                this.CACHE_KEY,
                `${this.INSTANCE_TYPE}-${this.INSTANCE_ID}`,
                Buffer.from(JSON.stringify(metrics)),
            );

            this.eld.reset();
        } catch (error) {
            this.logger.warn('Failed to report metrics', (error as Error).message);
        }
    }
}
