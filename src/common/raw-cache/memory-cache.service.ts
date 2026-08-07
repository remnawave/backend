import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { TypedConfigService } from '@common/config/app-config';
import { getRedisChannelName } from '@common/utils';

@Injectable()
export class MemoryCacheService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MemoryCacheService.name);
    private static readonly CHANNEL = 'l1:invalidate';

    private readonly cache = new LRUCache<string, object | string>({
        max: 1000,
        ttl: 30 * 60 * 1000,
    });

    private readonly channel: string;

    private subscriber: Redis;
    private everConnected = false;

    constructor(
        @InjectRedis() private readonly redis: Redis,
        configService: TypedConfigService,
    ) {
        this.channel = getRedisChannelName(configService, MemoryCacheService.CHANNEL);
    }

    async onModuleInit() {
        this.subscriber = this.redis.duplicate();

        this.subscriber.on('ready', () => {
            this.logger.log('Memory cache subscriber ready');
            if (this.everConnected) this.cache.clear();
            this.everConnected = true;
        });

        this.subscriber.on('message', (_channel, key) => {
            if (key === '*') this.cache.clear();
            else this.cache.delete(key);
        });

        await this.subscriber.subscribe(this.channel);
    }

    get<T>(key: string): T | undefined {
        return this.cache.get(key) as T | undefined;
    }

    set(key: string, value: object | string, ttlMs?: number): void {
        this.cache.set(key, value, ttlMs ? { ttl: ttlMs } : undefined);
    }

    async invalidate(key: string): Promise<void> {
        this.cache.delete(key);
        await this.redis.publish(this.channel, key);
    }

    async invalidateMany(keys: string[]): Promise<void> {
        for (const key of keys) this.cache.delete(key);
        await Promise.all(keys.map((key) => this.redis.publish(this.channel, key)));
    }

    async onModuleDestroy() {
        await this.subscriber.quit();
    }
}
