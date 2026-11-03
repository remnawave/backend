import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { SubscriptionTemplateRepository } from '../../repositories/subscription-template.repository';
import { CheckTemplateExistsQuery } from './check-template-exists.query';

// Not cached on purpose: getCachedTemplateByType falls back to Default for unknown names.
@QueryHandler(CheckTemplateExistsQuery)
export class CheckTemplateExistsHandler implements IQueryHandler<CheckTemplateExistsQuery> {
    private readonly logger = new Logger(CheckTemplateExistsHandler.name);

    constructor(private readonly subscriptionTemplateRepository: SubscriptionTemplateRepository) {}

    async execute(query: CheckTemplateExistsQuery) {
        try {
            return ok(
                await this.subscriptionTemplateRepository.existsByNameAndType(
                    query.name,
                    query.templateType,
                ),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
