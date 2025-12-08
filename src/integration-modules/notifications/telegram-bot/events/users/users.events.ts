import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { NotificationsConfigService } from '@common/config/common-config';
import { TUserEvents } from '@libs/contracts/constants';

import { UserEvent } from '@integration-modules/notifications/interfaces';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger';

import { USERS_EVENTS_TEMPLATES } from './users.events.templates';

type EventHandler = (event: UserEvent) => string | null;

@Injectable()
export class UsersEvents implements OnApplicationBootstrap {
    private readonly adminId: string | undefined;
    private readonly adminThreadId: string | undefined;
    private readonly logger = new Logger(UsersEvents.name);

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly notificationsConfig: NotificationsConfigService,
        private readonly telegramQueue: TelegramBotLoggerQueueService,
        private readonly configService: ConfigService,
    ) {
        this.adminId = this.configService.get<string>('TELEGRAM_NOTIFY_USERS_CHAT_ID');
        this.adminThreadId = this.configService.get<string>('TELEGRAM_NOTIFY_USERS_THREAD_ID');
    }

    async onApplicationBootstrap(): Promise<void> {
        this.registerEnabledListeners();
    }

    private registerEnabledListeners(): void {
        if (!this.adminId) return;

        for (const [eventName, template] of Object.entries(USERS_EVENTS_TEMPLATES)) {
            if (!this.notificationsConfig.isEnabled(eventName as TUserEvents, 'telegram')) {
                this.logger.debug(
                    `[USERS_EVENTS] Event "${eventName}" is not enabled for Telegram.`,
                );
                continue;
            }

            this.eventEmitter.on(eventName, async (event: UserEvent) => {
                await this.handleEvent(event, template);
            });
        }
    }

    private async handleEvent(event: UserEvent, template: EventHandler): Promise<void> {
        const message = template(event);

        if (!message) return;

        await this.telegramQueue.addJobToSendTelegramMessage({
            message,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }
}
