import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesRepository } from '../../repositories/nodes.repository';
import { GetProfileUuidsByIntegrationUuidQuery } from './get-profile-uuids-by-integration-uuid.query';

@QueryHandler(GetProfileUuidsByIntegrationUuidQuery)
export class GetProfileUuidsByIntegrationUuidHandler implements IQueryHandler<GetProfileUuidsByIntegrationUuidQuery> {
    private readonly logger = new Logger(GetProfileUuidsByIntegrationUuidHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(query: GetProfileUuidsByIntegrationUuidQuery) {
        try {
            const profileUuids = await this.nodesRepository.getProfileUuidsByIntegrationUuid(
                query.integrationUuid,
            );

            return ok(profileUuids);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
