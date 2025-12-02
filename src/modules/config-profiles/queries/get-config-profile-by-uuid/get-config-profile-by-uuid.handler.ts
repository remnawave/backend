import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { ConfigProfileRepository } from '@modules/config-profiles/repositories/config-profile.repository';
import { ConfigProfileWithInboundsAndNodesEntity } from '@modules/config-profiles/entities';

import { GetConfigProfileByUuidQuery } from './get-config-profile-by-uuid.query';

@QueryHandler(GetConfigProfileByUuidQuery)
export class GetConfigProfileByUuidHandler implements IQueryHandler<
    GetConfigProfileByUuidQuery,
    ICommandResponse<ConfigProfileWithInboundsAndNodesEntity>
> {
    private readonly logger = new Logger(GetConfigProfileByUuidHandler.name);
    constructor(private readonly configProfilesRepository: ConfigProfileRepository) {}

    async execute(query: GetConfigProfileByUuidQuery) {
        try {
            const result = await this.configProfilesRepository.getConfigProfileByUUID(query.uuid);

            if (!result) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_PROFILE_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_CONFIG_PROFILE_BY_UUID_ERROR,
            };
        }
    }
}
