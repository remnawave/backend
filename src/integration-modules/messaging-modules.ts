import {
    MessagingRedisExtensionModule,
    RedisChannelConfig,
} from '@kastov/messaging-redis-extension';

import { MessagingModule } from '@nestjstools/messaging';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { isDevelopment, isScheduler } from '@common/utils/startup-app';
import { getRedisConnectionOptions } from '@common/utils';
import { MessagingBuses, MessagingChannels, MessagingQueues } from '@libs/contracts/constants';

@Module({
    imports: [
        MessagingRedisExtensionModule,
        MessagingModule.forRootAsync({
            imports: [ConfigModule],
            buses: [
                {
                    name: MessagingBuses.EVENT,
                    channels: [MessagingChannels.EVENT],
                },
            ],
            inject: [ConfigService],
            useChannelFactory: (configService: ConfigService) => {
                return [
                    new RedisChannelConfig({
                        name: MessagingChannels.EVENT,
                        queue: MessagingQueues.EVENT,
                        bullJobOptions: {
                            removeOnComplete: 50,
                            removeOnFail: 50,
                        },
                        connection: {
                            connectionOpts: {
                                ...getRedisConnectionOptions(
                                    configService.get<string>('REDIS_SOCKET'),
                                    configService.get<string>('REDIS_HOST'),
                                    configService.get<number>('REDIS_PORT'),
                                    'ioredis',
                                ),
                            },
                            db: configService.getOrThrow<number>('REDIS_DB'),
                            password: configService.get<string | undefined>('REDIS_PASSWORD'),
                        },
                        keyPrefix: 'ebus',
                        middlewares: [],
                        avoidErrorsForNotExistedHandlers: true,
                        enableConsumer: isScheduler(),
                    }),
                ];
            },
            debug: isDevelopment(),
        }),
    ],
})
export class MessagingModules {}
