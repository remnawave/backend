import { InjectBot } from '@kastov/grammy-nestjs';
import { Context } from 'grammy';
import { Bot } from 'grammy';
import dayjs from 'dayjs';

import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { prettyBytesUtil } from '@common/utils/bytes';
import { EVENTS } from '@libs/contracts/constants';

import { UserEvent } from '@integration-modules/notifications/interfaces';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger';

import { BOT_NAME } from '../../constants/bot-name.constant';
import { RequireAdminId } from '../../decorators';

export class UsersEvents {
    private readonly adminId: string | undefined;
    private readonly adminThreadId: string | undefined;

    constructor(
        @InjectBot(BOT_NAME)
        private readonly _: Bot<Context>,

        private readonly telegramBotLoggerQueueService: TelegramBotLoggerQueueService,
        private readonly configService: ConfigService,
    ) {
        this.adminId = this.configService.get<string>('TELEGRAM_NOTIFY_USERS_CHAT_ID');
        this.adminThreadId = this.configService.get<string>('TELEGRAM_NOTIFY_USERS_THREAD_ID');
    }

    @OnEvent(EVENTS.USER.CREATED)
    @RequireAdminId()
    async onUserCreated(event: UserEvent): Promise<void> {
        const msg = `
🆕 <b>#created</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
<b>Traffic limit:</b> <code>${prettyBytesUtil(event.user.trafficLimitBytes)}</code>
<b>Valid until:</b> <code>${dayjs(event.user.expireAt).format('DD.MM.YYYY HH:mm')} UTC</code>
<b>Sub:</b> <code>${event.user.shortUuid}</code>
<b>Internal Squads:</b> <code>${event.user.activeInternalSquads.map((squad) => squad.name).join(', ')}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.MODIFIED)
    @RequireAdminId()
    async onUserModified(event: UserEvent): Promise<void> {
        const msg = `
📝 <b>#modified</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
<b>Traffic limit:</b> <code>${prettyBytesUtil(event.user.trafficLimitBytes)}</code>
<b>Valid until:</b> <code>${dayjs(event.user.expireAt).format('DD.MM.YYYY HH:mm')} UTC</code>
<b>Sub:</b> <code>${event.user.shortUuid}</code>
<b>Internal Squads:</b> <code>${event.user.activeInternalSquads.map((squad) => squad.name).join(', ')}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.REVOKED)
    @RequireAdminId()
    async onUserRevoked(event: UserEvent): Promise<void> {
        const msg = `
🔄 <b>#revoked</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
<b>Traffic limit:</b> <code>${prettyBytesUtil(event.user.trafficLimitBytes)}</code>
<b>Valid until:</b> <code>${dayjs(event.user.expireAt).format('DD.MM.YYYY HH:mm')} UTC</code>
<b>Sub:</b> <code>${event.user.shortUuid}</code>
<b>Internal Squads:</b> <code>${event.user.activeInternalSquads.map((squad) => squad.name).join(', ')}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.TRAFFIC_RESET)
    @RequireAdminId()
    async onUserTrafficReset(event: UserEvent): Promise<void> {
        const msg = `
🔄 <b>#traffic_reset</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
<b>Traffic:</b> <code>${prettyBytesUtil(event.user.usedTrafficBytes)}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.DELETED)
    @RequireAdminId()
    async onUserDeleted(event: UserEvent): Promise<void> {
        const msg = `
🗑️ <b>#deleted</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.DISABLED)
    @RequireAdminId()
    async onUserDisabled(event: UserEvent): Promise<void> {
        const msg = `
❌ <b>#disabled</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.ENABLED)
    @RequireAdminId()
    async onUserEnabled(event: UserEvent): Promise<void> {
        const msg = `
✅ <b>#enabled</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.LIMITED)
    @RequireAdminId()
    async onUserLimited(event: UserEvent): Promise<void> {
        const msg = `
⚠️ <b>#limited</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.EXPIRED)
    @RequireAdminId()
    async onUserExpired(event: UserEvent): Promise<void> {
        const msg = `
⏱️ <b>#expired</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.EXPIRE_NOTIFY.EXPIRES_IN_72_HOURS)
    @RequireAdminId()
    async onUserExpiresIn72Hours(event: UserEvent): Promise<void> {
        const msg = `
⏱️ <b>#expires_in_72_hours</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.EXPIRE_NOTIFY.EXPIRES_IN_48_HOURS)
    @RequireAdminId()
    async onUserExpiresIn48Hours(event: UserEvent): Promise<void> {
        const msg = `
⏱️ <b>#expires_in_48_hours</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.EXPIRE_NOTIFY.EXPIRES_IN_24_HOURS)
    @RequireAdminId()
    async onUserExpiresIn24Hours(event: UserEvent): Promise<void> {
        const msg = `
⏱️ <b>#expires_in_24_hours</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.EXPIRE_NOTIFY.EXPIRED_24_HOURS_AGO)
    @RequireAdminId()
    async onUserExpired24HoursAgo(event: UserEvent): Promise<void> {
        const msg = `
⏱️ <b>#expired_24_hours_ago</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.FIRST_CONNECTED)
    @RequireAdminId()
    async onUserFirstConnected(event: UserEvent): Promise<void> {
        const msg = `
🆕 <b>#first_connected</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.BANDWIDTH_USAGE_THRESHOLD_REACHED)
    @RequireAdminId()
    async onUserThresholdNotification(event: UserEvent): Promise<void> {
        if (event.skipTelegramNotification) {
            return;
        }

        const msg = `
⚠️ <b>#bandwidth_usage_threshold_reached</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
<b>Traffic:</b> <code>${prettyBytesUtil(event.user.usedTrafficBytes)}</code>
<b>Limit:</b> <code>${prettyBytesUtil(event.user.trafficLimitBytes)}</code>

<b>Threshold:</b> <code>${event.user.lastTriggeredThreshold}%</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }

    @OnEvent(EVENTS.USER.NOT_CONNECTED)
    @RequireAdminId()
    async onUserNotConnected(event: UserEvent): Promise<void> {
        if (event.skipTelegramNotification) {
            return;
        }

        if (!event.meta) {
            return;
        }

        const msg = `
⏱️ <b>#not_connected_after_${event.meta.notConnectedAfterHours}_hours</b>
➖➖➖➖➖➖➖➖➖
<b>Username:</b> <code>${event.user.username}</code>
        `;

        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.adminId!,
            threadId: this.adminThreadId,
        });
    }
}
