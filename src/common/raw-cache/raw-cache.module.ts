import { RedisModule, RedisModuleOptions } from '@songkeys/nestjs-redis';

import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { getRedisConnectionOptions } from '@common/utils/get-redis-connection-options';

import { MemoryCacheService } from './memory-cache.service';
import { RawCacheService } from './raw-cache.service';

@Global()
@Module({
    imports: [
        RedisModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService): Promise<RedisModuleOptions> => {
                return {
                    config: {
                        ...getRedisConnectionOptions(
                            configService.get<string>('REDIS_SOCKET'),
                            configService.get<string>('REDIS_HOST'),
                            configService.get<number>('REDIS_PORT'),
                            'ioredis',
                        ),
                        db: configService.getOrThrow<number>('REDIS_DB'),
                        password: configService.get<string | undefined>('REDIS_PASSWORD'),
                        username: configService.get<string | undefined>('REDIS_USERNAME'),
                        keyPrefix: 'ioraw:',
                    },
                } satisfies RedisModuleOptions;
            },
            inject: [ConfigService],
        }),
    ],
    providers: [RawCacheService, MemoryCacheService],
    exports: [RawCacheService],
})
export class RawCacheModule {}
