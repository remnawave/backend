import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { ExternalSquadRepository } from '@modules/external-squads/repositories/external-squad.repository';

import { GetTemplateNameQuery } from './get-template-name.query';

@QueryHandler(GetTemplateNameQuery)
export class GetTemplateNameHandler implements IQueryHandler<GetTemplateNameQuery> {
    private readonly logger = new Logger(GetTemplateNameHandler.name);
    constructor(private readonly externalSquadRepository: ExternalSquadRepository) {}

    async execute(query: GetTemplateNameQuery) {
        try {
            if (query.templateType === 'XRAY_BASE64') {
                return fail(ERRORS.TEMPLATE_TYPE_NOT_ALLOWED);
            }

            const result = await this.externalSquadRepository.getTemplateName(
                query.externalSquadUuid,
                query.templateType,
            );

            if (!result) {
                return fail(ERRORS.SUBSCRIPTION_TEMPLATE_NOT_FOUND);
            }

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
