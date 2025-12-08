import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { NotificationsConfigService } from '@common/config/common-config';
import { TServiceEvents, TErrorsEvents } from '@libs/contracts/constants';

import { ServiceEvent, CustomErrorEvent } from '@integration-modules/notifications/interfaces';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger';

import {
    SERVICE_EVENTS_TEMPLATES,
    ERRORS_EVENTS_TEMPLATES,
    ServiceEventsTemplate,
    ErrorsEventsTemplate,
} from './service.events.templates';

@Injectable()
export class ServiceEvents implements OnApplicationBootstrap {
    private readonly logger = new Logger(ServiceEvents.name);
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

        for (const [eventName, template] of Object.entries(SERVICE_EVENTS_TEMPLATES)) {
            if (!this.notificationsConfig.isEnabled(eventName as TServiceEvents, 'telegram')) {
                this.logger.debug(`Event "${eventName}" is not enabled for Telegram`);
                continue;
            }

            this.eventEmitter.on(eventName, (event: ServiceEvent) =>
                this.handleServiceEvent(event, template),
            );
        }

        for (const [eventName, template] of Object.entries(ERRORS_EVENTS_TEMPLATES)) {
            if (!this.notificationsConfig.isEnabled(eventName as TErrorsEvents, 'telegram')) {
                this.logger.debug(`Event "${eventName}" is not enabled for Telegram`);
                continue;
            }

            this.eventEmitter.on(eventName, (event: CustomErrorEvent) =>
                this.handleErrorEvent(event, template),
            );
        }
    }

    private async handleServiceEvent(
        event: ServiceEvent,
        template: ServiceEventsTemplate,
    ): Promise<void> {
        const message = template(event);

        if (!message) return;

        await this.telegramQueue.addJobToSendTelegramMessage({
            message,
            chatId: this.chatId!,
            threadId: this.threadId,
        });
    }

    private async handleErrorEvent(
        event: CustomErrorEvent,
        template: ErrorsEventsTemplate,
    ): Promise<void> {
        const message = template(event);

        if (!message) return;

        await this.telegramQueue.addJobToSendTelegramMessage({
            message,
            chatId: this.chatId!,
            threadId: this.threadId,
        });
    }
}
