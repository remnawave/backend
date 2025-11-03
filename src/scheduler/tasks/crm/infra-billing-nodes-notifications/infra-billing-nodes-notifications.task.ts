import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { QueryBus } from '@nestjs/cqrs';

import { EVENTS } from '@libs/contracts/constants/events/events';

import { CrmEvent } from '@integration-modules/notifications/interfaces';

import { GetBillingNodesForNotificationsQuery } from '@modules/infra-billing/queries/get-billing-nodes-for-notifications/get-billing-nodes-for-notifications.query';

import { JOBS_INTERVALS } from '../../../intervals';

@Injectable()
export class InfraBillingNodesNotificationsTask {
    private static readonly CRON_NAME = 'infraBillingNodesNotifications';
    private readonly logger = new Logger(InfraBillingNodesNotificationsTask.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    @Cron(JOBS_INTERVALS.CRM.INFRA_BILLING_NODES_NOTIFICATIONS, {
        name: InfraBillingNodesNotificationsTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            const result = await this.queryBus.execute(new GetBillingNodesForNotificationsQuery());

            if (!result.isOk || !result.response) {
                this.logger.error(result);
                return;
            }

            const billingNodes = result.response;
            for (const node of billingNodes) {
                if (!node.notificationType) {
                    continue;
                }

                this.eventEmitter.emit(
                    EVENTS.CRM[node.notificationType],
                    new CrmEvent(
                        {
                            nodeName: node.nodeName,
                            providerName: node.providerName,
                            loginUrl: node.loginUrl ?? 'https://docs.rw',
                            nextBillingAt: node.nextBillingAt,
                        },
                        EVENTS.CRM[node.notificationType],
                    ),
                );
            }

            this.logger.log(`Sent ${billingNodes.length} notifications`);
        } catch (error) {
            this.logger.error(error);
        }
    }
}
