import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { SubscriptionTemplateRepository } from '../../repositories/subscription-template.repository';
import { GetSubscriptionTemplateByUuidQuery } from './get-template-by-uuid.query';

@QueryHandler(GetSubscriptionTemplateByUuidQuery)
export class GetSubscriptionTemplateByUuidHandler implements IQueryHandler<GetSubscriptionTemplateByUuidQuery> {
    private readonly logger = new Logger(GetSubscriptionTemplateByUuidHandler.name);

    constructor(private readonly subscriptionTemplateRepository: SubscriptionTemplateRepository) {}

    async execute(query: GetSubscriptionTemplateByUuidQuery) {
        try {
            const template = await this.subscriptionTemplateRepository.findByUUID(query.uuid);

            if (!template) {
                return fail(ERRORS.SUBSCRIPTION_TEMPLATE_NOT_FOUND);
            }

            return ok(template);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
