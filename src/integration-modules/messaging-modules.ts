import {
    MessagingRedisExtensionModule,
    RedisChannelConfig,
} from '@kastov/messaging-redis-extension';

import { MessagingModule } from '@nestjstools/messaging';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { isDevelopment, isScheduler } from '@common/utils/startup-app';
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
                const socketPath = configService.get<string>('REDIS_SOCKET_PATH');
                const host = configService.get<string>('REDIS_HOST');
                const port = configService.get<number>('REDIS_PORT');
                const db = configService.getOrThrow<number>('REDIS_DB');
                const password = configService.get<string | undefined>('REDIS_PASSWORD');

                // BullMQ uses ioredis which supports path option for Unix sockets
                // Type assertion needed as @kastov/messaging-redis-extension types don't include path
                const connection = (
                    socketPath
                        ? { path: socketPath, db, password }
                        : { host, port, db, password }
                ) as unknown as RedisChannelConfig['connection'];

                return [
                    new RedisChannelConfig({
                        name: MessagingChannels.EVENT,
                        queue: MessagingQueues.EVENT,
                        bullJobOptions: {
                            removeOnComplete: 50,
                            removeOnFail: 50,
                        },
                        connection,
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
