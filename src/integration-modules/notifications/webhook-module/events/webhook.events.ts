import { instanceToPlain } from 'class-transformer';
import { serialize } from 'superjson';
import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { NotificationsConfigService } from '@common/config/common-config';
import { EVENTS, EVENTS_SCOPES } from '@libs/contracts/constants';

import {
    UserEvent,
    ServiceEvent,
    CustomErrorEvent,
    NodeEvent,
    CrmEvent,
    UserHwidDeviceEvent,
    TorrentBlockerEvent,
} from '@integration-modules/notifications/interfaces';

import { GetFullUserResponseModel } from '@modules/users/models';
import { GetOneNodeResponseModel } from '@modules/nodes/models';

import { WebhookLoggerQueueService } from '@queue/notifications/webhook-logger/webhook-logger.service';

@Injectable()
export class WebhookEvents {
    private readonly logger = new Logger(WebhookEvents.name);
    private readonly webhookUrls: string[];
    private readonly subPublicDomain: string;

    constructor(
        private readonly webhookLoggerQueueService: WebhookLoggerQueueService,
        private readonly configService: ConfigService,
        private readonly notificationsConfig: NotificationsConfigService,
    ) {
        this.subPublicDomain = this.configService.getOrThrow<string>('SUB_PUBLIC_DOMAIN');
        this.webhookUrls = this.configService
            .getOrThrow<string>('WEBHOOK_URL')
            .split(',')
            .map((url) => url.trim());
    }

    @OnEvent(EVENTS.CATCH_ALL_USER_EVENTS)
    async onCatchAllUserEvents(event: UserEvent): Promise<void> {
        try {
            if (!this.notificationsConfig.isEnabled(event.eventName, 'webhook')) {
                return;
            }

            const payload = {
                scope: EVENTS_SCOPES.USER,
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain(
                    new GetFullUserResponseModel(event.user, this.subPublicDomain),
                ),
                meta: instanceToPlain(event.meta),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhooks(
                {
                    payload: JSON.stringify(json),
                    timestamp: payload.timestamp,
                },
                this.webhookUrls,
            );
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_NODE_EVENTS)
    async onCatchAllNodeEvents(event: NodeEvent): Promise<void> {
        try {
            if (!this.notificationsConfig.isEnabled(event.eventName, 'webhook')) {
                return;
            }

            const payload = {
                scope: EVENTS_SCOPES.NODE,
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain(new GetOneNodeResponseModel(event.node)),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhooks(
                {
                    payload: JSON.stringify(json),
                    timestamp: payload.timestamp,
                },
                this.webhookUrls,
            );
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_SERVICE_EVENTS)
    async onCatchAllServiceEvents(event: ServiceEvent): Promise<void> {
        try {
            if (!this.notificationsConfig.isEnabled(event.eventName, 'webhook')) {
                return;
            }

            const payload = {
                scope: EVENTS_SCOPES.SERVICE,
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain(event.data),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhooks(
                {
                    payload: JSON.stringify(json),
                    timestamp: payload.timestamp,
                },
                this.webhookUrls,
            );
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_ERRORS_EVENTS)
    async onCatchAllErrorsEvents(event: CustomErrorEvent): Promise<void> {
        try {
            if (!this.notificationsConfig.isEnabled(event.eventName, 'webhook')) {
                return;
            }

            const payload = {
                scope: EVENTS_SCOPES.ERRORS,
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain(event.data),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhooks(
                {
                    payload: JSON.stringify(json),
                    timestamp: payload.timestamp,
                },
                this.webhookUrls,
            );
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_CRM_EVENTS)
    async onCatchAllCrmEvents(event: CrmEvent): Promise<void> {
        try {
            if (!this.notificationsConfig.isEnabled(event.eventName, 'webhook')) {
                return;
            }

            const payload = {
                scope: EVENTS_SCOPES.CRM,
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain(event.data),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhooks(
                {
                    payload: JSON.stringify(json),
                    timestamp: payload.timestamp,
                },
                this.webhookUrls,
            );
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_USER_HWID_DEVICES_EVENTS)
    async onCatchAllUserHwidDevicesEvents(event: UserHwidDeviceEvent): Promise<void> {
        try {
            if (!this.notificationsConfig.isEnabled(event.eventName, 'webhook')) {
                return;
            }

            const payload = {
                scope: EVENTS_SCOPES.USER_HWID_DEVICES,
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain({
                    ...event.data,
                    user: new GetFullUserResponseModel(event.data.user, this.subPublicDomain),
                }),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhooks(
                {
                    payload: JSON.stringify(json),
                    timestamp: payload.timestamp,
                },
                this.webhookUrls,
            );
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_TORRENT_BLOCKER_EVENTS)
    async onCatchAllTorrentBlockerEvents(event: TorrentBlockerEvent): Promise<void> {
        try {
            if (!this.notificationsConfig.isEnabled(event.eventName, 'webhook')) {
                return;
            }

            const payload = {
                scope: EVENTS_SCOPES.TORRENT_BLOCKER,
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain({
                    ...event.data,
                    node: new GetOneNodeResponseModel(event.data.node),
                    user: new GetFullUserResponseModel(event.data.user, this.subPublicDomain),
                }),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhooks(
                {
                    payload: JSON.stringify(json),
                    timestamp: payload.timestamp,
                },
                this.webhookUrls,
            );
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }
}
