import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { ExternalSquadRepository } from '@modules/external-squads/repositories/external-squad.repository';
import { ExternalSquadEntity } from '@modules/external-squads/entities';

import { GetExternalSquadSettingsQuery } from './get-external-squad-settings.query';

@QueryHandler(GetExternalSquadSettingsQuery)
export class GetExternalSquadSettingsHandler
    implements
        IQueryHandler<
            GetExternalSquadSettingsQuery,
            ICommandResponse<Pick<
                ExternalSquadEntity,
                'subscriptionSettings' | 'hostOverrides'
            > | null>
        >
{
    private readonly logger = new Logger(GetExternalSquadSettingsHandler.name);
    constructor(private readonly externalSquadRepository: ExternalSquadRepository) {}

    async execute(
        query: GetExternalSquadSettingsQuery,
    ): Promise<
        ICommandResponse<Pick<ExternalSquadEntity, 'subscriptionSettings' | 'hostOverrides'> | null>
    > {
        try {
            const result = await this.externalSquadRepository.getExternalSquadSettings(
                query.externalSquadUuid,
            );

            return {
                isOk: true,
                response: result,
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
