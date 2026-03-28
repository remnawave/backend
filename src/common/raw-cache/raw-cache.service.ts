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

    async getNumber(key: string): Promise<number> {
        const raw = await this.redis.get(key);
        return raw ? Number(raw) : 0;
    }

    async setNumber(key: string, value: number, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.redis.set(key, value, 'EX', ttlSeconds);
        } else {
            await this.redis.set(key, value);
        }
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async delMany(keys: string[]): Promise<void> {
        if (keys.length === 0) return;
        await this.redis.del(...keys);
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

    async setMany(entries: { key: string; value: unknown; ttlSeconds?: number }[]): Promise<void> {
        const pipe = this.redis.pipeline();
        for (const { key, value, ttlSeconds } of entries) {
            const raw =
                typeof value === 'number' || typeof value === 'string'
                    ? value
                    : JSON.stringify(value);
            if (ttlSeconds) {
                pipe.set(key, raw, 'EX', ttlSeconds);
            } else {
                pipe.set(key, raw);
            }
        }
        await pipe.exec();
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
