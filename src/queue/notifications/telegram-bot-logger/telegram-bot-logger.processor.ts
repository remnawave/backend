import { InjectBot } from '@kastov/grammy-nestjs';
import { parseMode } from '@grammyjs/parse-mode';
import { Context, GrammyError } from 'grammy';
import { Job } from 'bullmq';
import { Bot } from 'grammy';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Optional } from '@nestjs/common';

import { BOT_NAME } from '@integration-modules/notifications/telegram-bot/constants';

import { TelegramBotLoggerQueueService } from './telegram-bot-logger.service';
import { TelegramBotLoggerJobNames } from './enums';
import { QUEUES_NAMES } from '../../queue.enum';

@Processor(QUEUES_NAMES.NOTIFICATIONS.TELEGRAM, {
    concurrency: 100,
    limiter: {
        max: 20,
        duration: 1_000,
    },
})
export class TelegramBotLoggerQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(TelegramBotLoggerQueueProcessor.name);

    constructor(
        @Optional()
        @InjectBot(BOT_NAME)
        private readonly bot: Bot<Context>,
        private readonly telegramBotLoggerQueueService: TelegramBotLoggerQueueService,
    ) {
        super();
        if (this.bot) {
            this.bot.api.config.use(parseMode('html'));
        }
    }

    async process(job: Job) {
        if (!this.bot) {
            this.logger.debug(
                `Bot is not initialized. Skipping job "${job.name}" with ID: ${job?.id || ''}`,
            );
            return;
        }

        switch (job.name) {
            case TelegramBotLoggerJobNames.sendTelegramMessage:
                return this.handleSendTelegramMessage(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleSendTelegramMessage(
        job: Job<{ message: string; chatId: string; threadId: string | undefined }>,
    ) {
        const { message, chatId, threadId } = job.data;

        try {
            await this.bot.api.sendMessage(chatId, message, {
                link_preview_options: {
                    is_disabled: true,
                },
                ...(threadId && { message_thread_id: parseInt(threadId, 10) }),
            });
        } catch (error) {
            if (error instanceof GrammyError) {
                if (error.error_code === 429) {
                    const retryAfter = error.parameters.retry_after;
                    if (retryAfter) {
                        this.logger.warn(`Rate limit exceeded. Retrying in ${retryAfter} seconds.`);
                        await this.telegramBotLoggerQueueService.rateLimit(retryAfter);
                        return;
                    }
                }
            }
            this.logger.error(
                `Error handling "${TelegramBotLoggerJobNames.sendTelegramMessage}" job: ${error}`,
            );
        }
    }
}
