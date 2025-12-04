import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { InternalSquadRepository } from '@modules/internal-squads/repositories/internal-squad.repository';

import { GetAffectedConfigProfilesBySquadUuidQuery } from './get-affected-config-profiles-by-squad-uuid.query';

@QueryHandler(GetAffectedConfigProfilesBySquadUuidQuery)
export class GetAffectedConfigProfilesBySquadUuidHandler implements IQueryHandler<
    GetAffectedConfigProfilesBySquadUuidQuery,
    TResult<string[]>
> {
    private readonly logger = new Logger(GetAffectedConfigProfilesBySquadUuidHandler.name);
    constructor(private readonly internalSquadRepository: InternalSquadRepository) {}

    async execute(query: GetAffectedConfigProfilesBySquadUuidQuery): Promise<TResult<string[]>> {
        try {
            const result = await this.internalSquadRepository.getConfigProfilesBySquadUuid(
                query.internalSquadUuid,
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
