import Redis, { ChainableCommander, ScanStream } from 'ioredis';
import { InjectRedis } from '@songkeys/nestjs-redis';

import { Injectable } from '@nestjs/common';

@Injectable()
export class RawCacheService {
    constructor(@InjectRedis() private readonly redis: Redis) {}

    async get<T>(key: string): Promise<T | null> {
        const raw = await this.redis.get(key);
        return raw ? JSON.parse(raw) : null;
    }

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        const raw = JSON.stringify(value);
        if (ttlSeconds) {
            await this.redis.set(key, raw, 'EX', ttlSeconds);
        } else {
            await this.redis.set(key, raw);
        }
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async hgetallParsed<T>(key: string): Promise<T | null> {
        const raw = await this.redis.hgetall(key);
        if (!Object.keys(raw).length) return null;
        const parsed: Record<string, unknown> = {};
        for (const [field, value] of Object.entries(raw)) {
            try {
                parsed[field] = JSON.parse(value);
            } catch {
                parsed[field] = value;
            }
        }
        return parsed as T;
    }

    async hset(key: string, field: string, value: string): Promise<void> {
        await this.redis.hset(key, field, value);
    }

    async hsetJson(key: string, field: string, value: unknown): Promise<void> {
        await this.redis.hset(key, field, JSON.stringify(value));
    }

    createPipeline(): ChainableCommander {
        return this.redis.pipeline();
    }

    hscanStream(key: string, options?: { count?: number; match?: string }): ScanStream {
        return this.redis.hscanStream(key, options);
    }

    async exists(key: string): Promise<boolean> {
        return (await this.redis.exists(key)) === 1;
    }

    async rename(oldKey: string, newKey: string): Promise<void> {
        await this.redis.rename(oldKey, newKey);
    }
}
