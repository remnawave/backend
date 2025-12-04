import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesRepository } from '../../repositories/nodes.repository';
import { GetNodeByUuidQuery } from './get-node-by-uuid.query';

@QueryHandler(GetNodeByUuidQuery)
export class GetNodeByUuidHandler implements IQueryHandler<GetNodeByUuidQuery> {
    private readonly logger = new Logger(GetNodeByUuidHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(query: GetNodeByUuidQuery) {
        try {
            const node = await this.nodesRepository.findByUUID(query.uuid);

            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            return ok(node);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
