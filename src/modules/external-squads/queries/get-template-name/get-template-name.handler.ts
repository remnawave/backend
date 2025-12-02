import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { ExternalSquadRepository } from '@modules/external-squads/repositories/external-squad.repository';

import { GetTemplateNameQuery } from './get-template-name.query';

@QueryHandler(GetTemplateNameQuery)
export class GetTemplateNameHandler implements IQueryHandler<
    GetTemplateNameQuery,
    ICommandResponse<string | null>
> {
    private readonly logger = new Logger(GetTemplateNameHandler.name);
    constructor(private readonly externalSquadRepository: ExternalSquadRepository) {}

    async execute(query: GetTemplateNameQuery): Promise<ICommandResponse<string | null>> {
        try {
            if (query.templateType === 'XRAY_BASE64') {
                return {
                    isOk: true,
                    response: null,
                };
            }

            const result = await this.externalSquadRepository.getTemplateName(
                query.externalSquadUuid,
                query.templateType,
            );

            return {
                isOk: true,
                response: result || null,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }
}
