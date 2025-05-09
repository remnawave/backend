import { InjectBot } from '@kastov/grammy-nestjs';
import { Context } from 'grammy';
import { Bot } from 'grammy';
import dayjs from 'dayjs';

import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { prettyBytesUtil } from '@common/utils/bytes';
import { EVENTS } from '@libs/contracts/constants';

import { BOT_NAME } from '@integration-modules/telegram-bot/constants';

import { TelegramBotLoggerQueueService } from '@queue/loggers/telegram-bot-logger';

import { UserEvent } from './interfaces';

export class UsersEvents {
    private readonly adminId: string;
    private readonly adminThreadId: string | undefined;
    constructor(
        @InjectBot(BOT_NAME)
        private readonly _: Bot<Context>,

        private readonly telegramBotLoggerQueueService: TelegramBotLoggerQueueService,
        private readonly configService: ConfigService,
    ) {
        this.adminId = this.configService.getOrThrow<string>('TELEGRAM_NOTIFY_USERS_CHAT_ID');
        this.adminThreadId = this.configService.get<string>('TELEGRAM_NOTIFY_USERS_THREAD_ID');
    }

    @OnEvent(EVENTS.USER.CREATED)
    async onUserCreated(event: UserEvent): Promise<void> {
        const msg = `
🆕 <b>#created</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
<b>Traffic limit:</b> <code>${prettyBytesUtil(event.user.trafficLimitBytes)}</code>
<b>Valid until:</b> <code>${dayjs(event.user.expireAt).format('DD.MM.YYYY HH:mm')}</code>
<b>Sub:</b> <code>${event.user.shortUuid}</code>
<b>Inbounds:</b> <code>${event.user.activeUserInbounds.map((inbound) => inbound.tag).join(', ')}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.MODIFIED)
    async onUserModified(event: UserEvent): Promise<void> {
        const msg = `
📝 <b>#modified</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
<b>Traffic limit:</b> <code>${prettyBytesUtil(event.user.trafficLimitBytes)}</code>
<b>Valid until:</b> <code>${dayjs(event.user.expireAt).format('DD.MM.YYYY HH:mm')}</code>
<b>Sub:</b> <code>${event.user.shortUuid}</code>
<b>Inbounds:</b> <code>${event.user.activeUserInbounds.map((inbound) => inbound.tag).join(', ')}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.REVOKED)
    async onUserRevoked(event: UserEvent): Promise<void> {
        const msg = `
🔄 <b>#revoked</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
<b>Traffic limit:</b> <code>${prettyBytesUtil(event.user.trafficLimitBytes)}</code>
<b>Valid until:</b> <code>${dayjs(event.user.expireAt).format('DD.MM.YYYY HH:mm')}</code>
<b>Sub:</b> <code>${event.user.shortUuid}</code>
<b>Inbounds:</b> <code>${event.user.activeUserInbounds.map((inbound) => inbound.tag).join(', ')}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.TRAFFIC_RESET)
    async onUserTrafficReset(event: UserEvent): Promise<void> {
        const msg = `
🔄 <b>#traffic_reset</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
<b>Traffic:</b> <code>${prettyBytesUtil(event.user.usedTrafficBytes)}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.DELETED)
    async onUserDeleted(event: UserEvent): Promise<void> {
        const msg = `
🗑️ <b>#deleted</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.DISABLED)
    async onUserDisabled(event: UserEvent): Promise<void> {
        const msg = `
❌ <b>#disabled</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.ENABLED)
    async onUserEnabled(event: UserEvent): Promise<void> {
        const msg = `
✅ <b>#enabled</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.LIMITED)
    async onUserLimited(event: UserEvent): Promise<void> {
        const msg = `
⚠️ <b>#limited</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.EXPIRED)
    async onUserExpired(event: UserEvent): Promise<void> {
        const msg = `
⏱️ <b>#expired</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.EXPIRE_NOTIFY.EXPIRES_IN_72_HOURS)
    async onUserExpiresIn72Hours(event: UserEvent): Promise<void> {
        const msg = `
⏱️ <b>#expires_in_72_hours</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.EXPIRE_NOTIFY.EXPIRES_IN_48_HOURS)
    async onUserExpiresIn48Hours(event: UserEvent): Promise<void> {
        const msg = `
⏱️ <b>#expires_in_48_hours</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.EXPIRE_NOTIFY.EXPIRES_IN_24_HOURS)
    async onUserExpiresIn24Hours(event: UserEvent): Promise<void> {
        const msg = `
⏱️ <b>#expires_in_24_hours</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.EXPIRE_NOTIFY.EXPIRED_24_HOURS_AGO)
    async onUserExpired24HoursAgo(event: UserEvent): Promise<void> {
        const msg = `
⏱️ <b>#expired_24_hours_ago</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId,
            threadId: this.adminThreadId,
        });
    }
}
