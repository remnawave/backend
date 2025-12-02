import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { InfraBillingNodeNotificationEntity } from '@modules/infra-billing/entities';
import { InfraBillingNodeRepository } from '@modules/infra-billing/repositories';

import { GetBillingNodesForNotificationsQuery } from './get-billing-nodes-for-notifications.query';

@QueryHandler(GetBillingNodesForNotificationsQuery)
export class GetBillingNodesForNotificationsHandler implements IQueryHandler<
    GetBillingNodesForNotificationsQuery,
    ICommandResponse<InfraBillingNodeNotificationEntity[]>
> {
    private readonly logger = new Logger(GetBillingNodesForNotificationsHandler.name);
    constructor(private readonly infraBillingNodeRepository: InfraBillingNodeRepository) {}

    async execute() {
        try {
            const result = await this.infraBillingNodeRepository.getAllActiveNotifications();

            if (!result) {
                return {
                    isOk: false,
                    ...ERRORS.GET_BILLING_NODES_FOR_NOTIFICATIONS_ERROR,
                };
            }

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_BILLING_NODES_FOR_NOTIFICATIONS_ERROR,
            };
        }
    }
}
