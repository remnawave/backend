import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesRepository } from '../../repositories/nodes.repository';
import { GetExpectedUsersQuery } from './get-expected-users.query';

@QueryHandler(GetExpectedUsersQuery)
export class GetExpectedUsersHandler implements IQueryHandler<GetExpectedUsersQuery> {
    private readonly logger = new Logger(GetExpectedUsersHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(query: GetExpectedUsersQuery) {
        try {
            const node = await this.nodesRepository.findByUUID(query.nodeUuid);

            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            const rows = await this.nodesRepository.getExpectedUsersForNode(query.nodeUuid);
            return ok(rows);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
