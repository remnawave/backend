import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { NotificationsConfigService } from '@common/config/common-config';
import { TTorrentBlockerEvents } from '@libs/contracts/constants';

import { TorrentBlockerEvent } from '@integration-modules/notifications/interfaces';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger';

import {
    TORRENT_BLOCKER_EVENTS_TEMPLATES,
    TorrentBlockerEventsTemplate,
} from './torrent-blocker.events.templates';

@Injectable()
export class TorrentBlockerEvents implements OnApplicationBootstrap {
    private readonly logger = new Logger(TorrentBlockerEvents.name);
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

        for (const [eventName, template] of Object.entries(TORRENT_BLOCKER_EVENTS_TEMPLATES)) {
            if (
                !this.notificationsConfig.isEnabled(eventName as TTorrentBlockerEvents, 'telegram')
            ) {
                this.logger.debug(`Event "${eventName}" is not enabled for Telegram`);
                continue;
            }

            this.eventEmitter.on(eventName, (event: TorrentBlockerEvent) =>
                this.handleEvent(event, template),
            );
        }
    }

    private async handleEvent(
        event: TorrentBlockerEvent,
        template: TorrentBlockerEventsTemplate,
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
