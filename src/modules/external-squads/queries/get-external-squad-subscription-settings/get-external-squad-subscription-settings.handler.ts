import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { ExternalSquadRepository } from '@modules/external-squads/repositories/external-squad.repository';
import { ExternalSquadEntity } from '@modules/external-squads/entities';

import { GetExternalSquadSubscriptionSettingsQuery } from './get-external-squad-subscription-settings.query';

@QueryHandler(GetExternalSquadSubscriptionSettingsQuery)
export class GetExternalSquadSubscriptionSettingsHandler
    implements
        IQueryHandler<
            GetExternalSquadSubscriptionSettingsQuery,
            ICommandResponse<Pick<ExternalSquadEntity, 'subscriptionSettings'> | null>
        >
{
    private readonly logger = new Logger(GetExternalSquadSubscriptionSettingsHandler.name);
    constructor(private readonly externalSquadRepository: ExternalSquadRepository) {}

    async execute(
        query: GetExternalSquadSubscriptionSettingsQuery,
    ): Promise<ICommandResponse<Pick<ExternalSquadEntity, 'subscriptionSettings'> | null>> {
        try {
            const result = await this.externalSquadRepository.getExternalSquadSubscriptionSettings(
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
