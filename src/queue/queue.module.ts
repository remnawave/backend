import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';

import { BullModule } from '@nestjs/bullmq';
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TypedConfigService } from '@common/config/app-config';
import { getRedisConnectionOptions } from '@common/utils';
import { useBullBoard } from '@common/utils/startup-app';
import { BULLBOARD_ROOT } from '@libs/contracts/api';

import { NodesQueuesModule } from './_nodes/nodes-queues.module';
import { SquadsQueueModule } from './_squads/squads-queue.module';
import { UsersQueuesModule } from './_users/users-queues.module';
import { NOTIFICATIONS_MODULES } from './notifications/notifications-modules';
import { PushFromRedisQueueModule } from './push-from-redis/push-from-redis.module';
import { ServiceQueueModule } from './service/service.module';

const queueModules = [
    NodesQueuesModule,
    UsersQueuesModule,
    PushFromRedisQueueModule,
    SquadsQueueModule,

    ServiceQueueModule,

    ...NOTIFICATIONS_MODULES,
];

const bullBoard = [
    BullBoardModule.forRoot({
        route: BULLBOARD_ROOT,
        adapter: ExpressAdapter,
        boardOptions: {
            uiConfig: {
                boardTitle: 'Remnawave',
                boardLogo: {
                    path: 'https://docs.rw/img/logo.svg',
                    width: 32,
                    height: 32,
                },
                locale: {
                    lng: 'en',
                },
                pollingInterval: {
                    showSetting: true,
                    forceInterval: 3,
                },
                miscLinks: [
                    {
                        text: 'Return to dashboard',
                        url: '/dashboard',
                    },
                    {
                        text: 'Remnawave',
                        url: 'https://docs.rw',
                    },
                    {
                        text: 'Telegram',
                        url: 'https://t.me/remnawave',
                    },
                ],
            },
        },
    }),
];

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: TypedConfigService) => {
                return {
                    connection: {
                        ...getRedisConnectionOptions(
                            configService.get('REDIS_SOCKET'),
                            configService.get('REDIS_HOST'),
                            configService.get('REDIS_PORT'),
                            'ioredis',
                        ),
                        db: configService.getOrThrow('REDIS_DB'),
                        password: configService.get('REDIS_PASSWORD'),
                        username: configService.get('REDIS_USERNAME'),
                    },
                    defaultJobOptions: {
                        removeOnComplete: 500,
                        removeOnFail: 500,
                    },
                };
            },
            inject: [TypedConfigService],
        }),

        ...(useBullBoard() ? bullBoard : []),

        ...queueModules,
    ],
    exports: [...queueModules],
})
export class QueueModule {}
