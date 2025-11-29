import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { BasicAuthMiddleware } from '@common/middlewares';
import { useBullBoard } from '@common/utils/startup-app';
import { BULLBOARD_ROOT } from '@libs/contracts/api';

import { PushFromRedisQueueModule } from './push-from-redis/push-from-redis.module';
import { NOTIFICATIONS_MODULES } from './notifications/notifications-modules';
import { SquadsQueueModule } from './_squads/squads-queue.module';
import { NodesQueuesModule } from './_nodes/nodes-queues.module';
import { UsersQueuesModule } from './_users/users-queues.module';
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
        middleware: [BasicAuthMiddleware],
    }),
];

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.getOrThrow<string>('REDIS_HOST'),
                    port: configService.getOrThrow<number>('REDIS_PORT'),
                    db: configService.getOrThrow<number>('REDIS_DB'),
                    password: configService.get<string | undefined>('REDIS_PASSWORD'),
                },
                defaultJobOptions: {
                    removeOnComplete: 500,
                    removeOnFail: 500,
                },
            }),
            inject: [ConfigService],
        }),

        ...(useBullBoard() ? bullBoard : []),

        ...queueModules,
    ],
    exports: [...queueModules],
})
export class QueueModule {}
