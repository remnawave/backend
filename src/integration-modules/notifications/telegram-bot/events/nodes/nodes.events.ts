import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { NotificationsConfigService } from '@common/config/common-config';
import { TNodeEvents } from '@libs/contracts/constants';

import { NodeEvent } from '@integration-modules/notifications/interfaces';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger';

import { NODES_EVENTS_TEMPLATES, NodesEventsTemplate } from './nodes.events.templates';

@Injectable()
export class NodesEvents implements OnApplicationBootstrap {
    private readonly logger = new Logger(NodesEvents.name);
    private readonly chatId: string | undefined;
    private readonly threadId: string | undefined;

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly notificationsConfig: NotificationsConfigService,
        private readonly telegramQueue: TelegramBotLoggerQueueService,
        private readonly configService: ConfigService,
    ) {
        this.chatId = this.configService.get<string>('TELEGRAM_NOTIFY_NODES_CHAT_ID');
        this.threadId = this.configService.get<string>('TELEGRAM_NOTIFY_NODES_THREAD_ID');
    }

    onApplicationBootstrap(): void {
        this.registerEnabledListeners();
    }

    private registerEnabledListeners(): void {
        if (!this.chatId) return;

        for (const [eventName, template] of Object.entries(NODES_EVENTS_TEMPLATES)) {
            if (!this.notificationsConfig.isEnabled(eventName as TNodeEvents, 'telegram')) {
                this.logger.debug(`Event "${eventName}" is not enabled for Telegram`);
                continue;
            }

            this.eventEmitter.on(eventName, (event: NodeEvent) =>
                this.handleEvent(event, template),
            );
        }
    }

    private async handleEvent(event: NodeEvent, template: NodesEventsTemplate): Promise<void> {
        const message = template(event);

        if (!message) return;

        await this.telegramQueue.addJobToSendTelegramMessage({
            message,
            chatId: this.chatId!,
            threadId: this.threadId,
        });
    }
}
