import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { NotificationsConfigService } from '@common/config/common-config';
import { TCRMEvents } from '@libs/contracts/constants';

import { CrmEvent } from '@integration-modules/notifications/interfaces';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger';

import { CRM_EVENTS_TEMPLATES, CrmEventsTemplate } from './crm.events.templates';

@Injectable()
export class CrmEvents implements OnApplicationBootstrap {
    private readonly logger = new Logger(CrmEvents.name);
    private readonly chatId: string | undefined;
    private readonly threadId: string | undefined;

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly notificationsConfig: NotificationsConfigService,
        private readonly telegramQueue: TelegramBotLoggerQueueService,
        private readonly configService: ConfigService,
    ) {
        this.chatId = this.configService.get<string>('TELEGRAM_NOTIFY_CRM_CHAT_ID');
        this.threadId = this.configService.get<string>('TELEGRAM_NOTIFY_CRM_THREAD_ID');
    }

    onApplicationBootstrap(): void {
        this.registerEnabledListeners();
    }

    private registerEnabledListeners(): void {
        if (!this.chatId) return;

        for (const [eventName, template] of Object.entries(CRM_EVENTS_TEMPLATES)) {
            if (!this.notificationsConfig.isEnabled(eventName as TCRMEvents, 'telegram')) {
                this.logger.debug(`Event "${eventName}" is not enabled for Telegram`);
                continue;
            }

            this.eventEmitter.on(eventName, (event: CrmEvent) => this.handleEvent(event, template));
        }
    }

    private async handleEvent(event: CrmEvent, template: CrmEventsTemplate): Promise<void> {
        const message = template(event);
        if (!message) return;

        await this.telegramQueue.addJobToSendTelegramMessage({
            message,
            chatId: this.chatId!,
            threadId: this.threadId,
        });
    }
}
