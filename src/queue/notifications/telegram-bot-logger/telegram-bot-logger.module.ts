import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';

import { ConditionalModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { useBullBoard, useQueueProcessor } from '@common/utils/startup-app';

import { TelegramBotModule } from '@integration-modules/notifications/telegram-bot/telegram-bot.module';

import { TelegramBotLoggerQueueProcessor } from './telegram-bot-logger.processor';
import { TelegramBotLoggerQueueService } from './telegram-bot-logger.service';
import { QUEUES_NAMES } from '../../queue.enum';

const requiredModules = [
    CqrsModule,
    ConditionalModule.registerWhen(TelegramBotModule, 'IS_TELEGRAM_NOTIFICATIONS_ENABLED'),
];

const processors = [TelegramBotLoggerQueueProcessor];
const services = [TelegramBotLoggerQueueService];

const queues = [
    BullModule.registerQueue({
        name: QUEUES_NAMES.NOTIFICATIONS.TELEGRAM,
    }),
];

const bullBoard = [
    BullBoardModule.forFeature({
        name: QUEUES_NAMES.NOTIFICATIONS.TELEGRAM,
        adapter: BullMQAdapter,
    }),
];

const providers = useQueueProcessor() ? processors : [];
const imports = useBullBoard() ? bullBoard : [];

@Module({
    imports: [...queues, ...imports, ...requiredModules],
    providers: [...providers, ...services],
    exports: [...services],
})
export class TelegramBotLoggerQueueModule {}
