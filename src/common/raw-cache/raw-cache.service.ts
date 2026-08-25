import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis, { ChainableCommander, ScanStream } from 'ioredis';

import { Injectable, Logger } from '@nestjs/common';

import { MemoryCacheService } from './memory-cache.service';

@Injectable()
export class RawCacheService {
    private readonly logger = new Logger(RawCacheService.name);

    constructor(
        @InjectRedis() private readonly redis: Redis,
        private readonly memoryCacheService: MemoryCacheService,
    ) {}

    async get<T>(key: string, memCache: boolean = false): Promise<T | null> {
        if (memCache) {
            const hit = this.memoryCacheService.get<T>(key);
            if (hit !== undefined) return hit;
        }

        const raw = await this.redis.get(key);
        const parsed = raw ? (JSON.parse(raw) as T) : null;

        if (memCache && parsed !== null) {
            this.memoryCacheService.set(key, parsed as object);
        }

        return parsed;
    }

    async mget<T>(keys: string[]): Promise<(T | null)[]> {
        if (keys.length === 0) return [];
        const raws = await this.redis.mget(...keys);
        return raws.map((raw) => (raw ? JSON.parse(raw) : null));
    }

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        const raw = JSON.stringify(value);
        if (ttlSeconds) {
            await this.redis.set(key, raw, 'EX', ttlSeconds);
        } else {
            await this.redis.set(key, raw);
        }
    }

    async setString(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.redis.set(key, value, 'EX', ttlSeconds);
        } else {
            await this.redis.set(key, value);
        }
    }

    async getString(key: string, memCache: boolean = false): Promise<string | null> {
        if (memCache) {
            const hit = this.memoryCacheService.get<string>(key);
            if (hit !== undefined) return hit;
        }

        const raw = await this.redis.get(key);
        if (memCache && raw !== null) {
            this.memoryCacheService.set(key, raw);
        }

        return raw;
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

    /** Atomic counter with a sliding window; the TTL is set on first increment. */
    async incrementWithTtl(key: string, ttlSeconds: number): Promise<number> {
        const [[, value]] = (await this.redis
            .multi()
            .incr(key)
            .expire(key, ttlSeconds, 'NX')
            .exec()) as [[Error | null, number], [Error | null, number]];

        return value;
    }

    async getDelString(key: string): Promise<null | string> {
        return this.redis.getdel(key);
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
        await this.memoryCacheService.invalidate(key);
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

    async xaddTrimmed(
        key: string,
        maxLenApprox: number,
        fields: Record<string, string>,
    ): Promise<void> {
        await this.redis.xadd(
            key,
            'MAXLEN',
            '~',
            maxLenApprox,
            '*',
            ...Object.entries(fields).flat(),
        );
    }

    async xaddTrimmedByAge(
        key: string,
        maxAgeMs: number,
        fields: Record<string, string>,
    ): Promise<void> {
        await this.redis.xadd(
            key,
            'MINID',
            '~',
            Date.now() - maxAgeMs,
            '*',
            ...Object.entries(fields).flat(),
        );
    }

    async exists(key: string): Promise<boolean> {
        return (await this.redis.exists(key)) === 1;
    }

    async rename(oldKey: string, newKey: string): Promise<void> {
        await this.redis.rename(oldKey, newKey);
    }

    async cachedByKeys<TRow, TVal>(
        ids: string[],
        opts: {
            cacheKey: (id: string) => string;
            ttlSeconds: number;
            fetch: (missed: string[]) => Promise<TRow[]>;
            rowId: (row: TRow) => string;
            toValue: (row: TRow) => TVal;
        },
    ): Promise<Map<string, TVal>> {
        if (ids.length === 0) return new Map();

        const cached = await this.mget<{ v: TVal }>(ids.map(opts.cacheKey));
        const result = new Map<string, TVal>();
        const missed: string[] = [];

        ids.forEach((id, i) => (cached[i] ? result.set(id, cached[i]!.v) : missed.push(id)));

        if (missed.length) {
            const rows = await opts.fetch(missed);
            await this.setMany(
                rows.map((r) => ({
                    key: opts.cacheKey(opts.rowId(r)),
                    value: { v: opts.toValue(r) },
                    ttlSeconds: opts.ttlSeconds,
                })),
            );
            rows.forEach((r) => result.set(opts.rowId(r), opts.toValue(r)));
        }
        return result;
    }

    publishSafe(channel: string, message: unknown): void {
        void this.redis
            .publish(channel, JSON.stringify(message))
            .catch((e) => this.logger.error(`publish ${channel} failed: ${e}`));
    }
}
