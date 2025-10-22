import { instanceToPlain } from 'class-transformer';
import { serialize } from 'superjson';
import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EVENTS } from '@libs/contracts/constants';

import {
    UserEvent,
    ServiceEvent,
    CustomErrorEvent,
    NodeEvent,
    CrmEvent,
    UserHwidDeviceEvent,
} from '@integration-modules/notifications/interfaces';

import { WebhookLoggerQueueService } from '@queue/notifications/webhook-logger/webhook-logger.service';
@Injectable()
export class WebhookEvents {
    private readonly logger = new Logger(WebhookEvents.name);

    constructor(private readonly webhookLoggerQueueService: WebhookLoggerQueueService) {}

    @OnEvent(EVENTS.CATCH_ALL_USER_EVENTS)
    async onCatchAllUserEvents(event: UserEvent): Promise<void> {
        try {
            const payload = {
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain(event.user),
                meta: instanceToPlain(event.meta),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhook({
                payload: JSON.stringify(json),
                timestamp: payload.timestamp,
            });
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_NODE_EVENTS)
    async onCatchAllNodeEvents(event: NodeEvent): Promise<void> {
        try {
            const payload = {
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain(event.node),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhook({
                payload: JSON.stringify(json),
                timestamp: payload.timestamp,
            });
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_SERVICE_EVENTS)
    async onCatchAllServiceEvents(event: ServiceEvent): Promise<void> {
        try {
            const payload = {
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain(event.data),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhook({
                payload: JSON.stringify(json),
                timestamp: payload.timestamp,
            });
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_ERRORS_EVENTS)
    async onCatchAllErrorsEvents(event: CustomErrorEvent): Promise<void> {
        try {
            const payload = {
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain(event.data),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhook({
                payload: JSON.stringify(json),
                timestamp: payload.timestamp,
            });
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_CRM_EVENTS)
    async onCatchAllCrmEvents(event: CrmEvent): Promise<void> {
        try {
            const payload = {
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain(event.data),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhook({
                payload: JSON.stringify(json),
                timestamp: payload.timestamp,
            });
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_USER_HWID_DEVICES_EVENTS)
    async onCatchAllUserHwidDevicesEvents(event: UserHwidDeviceEvent): Promise<void> {
        try {
            const payload = {
                event: event.eventName,
                timestamp: dayjs().toISOString(),
                data: instanceToPlain(event.data),
            };

            const { json } = serialize(payload);

            await this.webhookLoggerQueueService.sendWebhook({
                payload: JSON.stringify(json),
                timestamp: payload.timestamp,
            });
        } catch (error) {
            this.logger.error(`Error sending webhook event: ${error}`);
        }
    }
}
