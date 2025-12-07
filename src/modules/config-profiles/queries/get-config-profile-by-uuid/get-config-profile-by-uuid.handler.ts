import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { ConfigProfileRepository } from '@modules/config-profiles/repositories/config-profile.repository';

import { GetConfigProfileByUuidQuery } from './get-config-profile-by-uuid.query';

@QueryHandler(GetConfigProfileByUuidQuery)
export class GetConfigProfileByUuidHandler implements IQueryHandler<GetConfigProfileByUuidQuery> {
    private readonly logger = new Logger(GetConfigProfileByUuidHandler.name);
    constructor(private readonly configProfilesRepository: ConfigProfileRepository) {}

    async execute(query: GetConfigProfileByUuidQuery) {
        try {
            const result = await this.configProfilesRepository.getConfigProfileByUUID(query.uuid);

            if (!result) return fail(ERRORS.CONFIG_PROFILE_NOT_FOUND);

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_CONFIG_PROFILE_BY_UUID_ERROR);
        }
    }
}
