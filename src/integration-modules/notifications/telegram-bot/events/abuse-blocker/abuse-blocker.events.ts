import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { TypedConfigService } from '@common/config/app-config';
import { NotificationsConfigService } from '@common/config/common-config';
import { TAbuseBlockerEvents } from '@libs/contracts/constants';

import { AbuseBlockerEvent } from '@integration-modules/notifications/interfaces';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger';

import {
    ABUSE_BLOCKER_EVENTS_TEMPLATES,
    AbuseBlockerEventsTemplate,
} from './abuse-blocker.events.templates';

@Injectable()
export class AbuseBlockerEvents implements OnApplicationBootstrap {
    private readonly logger = new Logger(AbuseBlockerEvents.name);
    private readonly chatId: string | undefined;
    private readonly threadId: string | undefined;
    private readonly panelDomain: string | undefined;

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly notificationsConfig: NotificationsConfigService,
        private readonly telegramQueue: TelegramBotLoggerQueueService,
        configService: TypedConfigService,
    ) {
        this.panelDomain = configService.get('PANEL_DOMAIN');
        const target = configService.get('TELEGRAM_NOTIFY_ABUSE_BLOCKER');
        if (target) [this.chatId, this.threadId] = target.split(':');
    }

    onApplicationBootstrap(): void {
        if (!this.chatId) return;
        for (const [eventName, template] of Object.entries(ABUSE_BLOCKER_EVENTS_TEMPLATES)) {
            if (!this.notificationsConfig.isEnabled(eventName as TAbuseBlockerEvents, 'telegram')) {
                this.logger.debug(`Event "${eventName}" is not enabled for Telegram`);
                continue;
            }
            this.eventEmitter.on(eventName, (event: AbuseBlockerEvent) =>
                this.handleEvent(event, template),
            );
        }
    }

    private async handleEvent(
        event: AbuseBlockerEvent,
        template: AbuseBlockerEventsTemplate,
    ): Promise<void> {
        const message = template(event, this.panelDomain);
        await this.telegramQueue.addJobToSendTelegramMessage({
            message: message.message,
            chatId: this.chatId!,
            threadId: this.threadId,
            keyboard: message.keyboard,
        });
    }
}
