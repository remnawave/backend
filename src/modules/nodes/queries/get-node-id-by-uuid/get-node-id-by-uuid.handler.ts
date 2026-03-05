import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesRepository } from '../../repositories/nodes.repository';
import { GetNodeIdByUuidQuery } from './get-node-id-by-uuid.query';

@QueryHandler(GetNodeIdByUuidQuery)
export class GetNodeIdByUuidHandler implements IQueryHandler<GetNodeIdByUuidQuery> {
    private readonly logger = new Logger(GetNodeIdByUuidHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(query: GetNodeIdByUuidQuery) {
        try {
            const nodeId = await this.nodesRepository.getNodeIdByUuid(query.uuid);

            if (nodeId === null) {
                return ok(null);
            }

            return ok(nodeId);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
