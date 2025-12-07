import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { ExternalSquadRepository } from '@modules/external-squads/repositories/external-squad.repository';
import { ExternalSquadEntity } from '@modules/external-squads/entities';

import { GetExternalSquadSettingsQuery } from './get-external-squad-settings.query';

@QueryHandler(GetExternalSquadSettingsQuery)
export class GetExternalSquadSettingsHandler implements IQueryHandler<
    GetExternalSquadSettingsQuery,
    TResult<Pick<
        ExternalSquadEntity,
        'subscriptionSettings' | 'hostOverrides' | 'responseHeaders' | 'hwidSettings'
    > | null>
> {
    private readonly logger = new Logger(GetExternalSquadSettingsHandler.name);
    constructor(private readonly externalSquadRepository: ExternalSquadRepository) {}

    async execute(
        query: GetExternalSquadSettingsQuery,
    ): Promise<
        TResult<Pick<
            ExternalSquadEntity,
            'subscriptionSettings' | 'hostOverrides' | 'responseHeaders' | 'hwidSettings'
        > | null>
    > {
        try {
            const result = await this.externalSquadRepository.getExternalSquadSettings(
                query.externalSquadUuid,
            );

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
