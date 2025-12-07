import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesRepository } from '../../repositories/nodes.repository';
import { GetOnlineNodesQuery } from './get-online-nodes.query';

@QueryHandler(GetOnlineNodesQuery)
export class GetOnlineNodesHandler implements IQueryHandler<GetOnlineNodesQuery> {
    private readonly logger = new Logger(GetOnlineNodesHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute() {
        try {
            const nodes = await this.nodesRepository.findConnectedNodesPartial();

            return ok(nodes);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
