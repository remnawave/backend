import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { InfraBillingNodeRepository } from '@modules/infra-billing/repositories';

import { GetBillingNodesForNotificationsQuery } from './get-billing-nodes-for-notifications.query';

@QueryHandler(GetBillingNodesForNotificationsQuery)
export class GetBillingNodesForNotificationsHandler implements IQueryHandler<GetBillingNodesForNotificationsQuery> {
    private readonly logger = new Logger(GetBillingNodesForNotificationsHandler.name);
    constructor(private readonly infraBillingNodeRepository: InfraBillingNodeRepository) {}

    async execute() {
        try {
            const result = await this.infraBillingNodeRepository.getAllActiveNotifications();

            if (!result) {
                return fail(ERRORS.GET_BILLING_NODES_FOR_NOTIFICATIONS_ERROR);
            }

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_BILLING_NODES_FOR_NOTIFICATIONS_ERROR);
        }
    }
}
