import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesRepository } from '../../repositories/nodes.repository';
import { GetEnabledNodesQuery } from './get-enabled-nodes.query';

@QueryHandler(GetEnabledNodesQuery)
export class GetEnabledNodesHandler implements IQueryHandler<GetEnabledNodesQuery> {
    private readonly logger = new Logger(GetEnabledNodesHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute() {
        try {
            const nodes = await this.nodesRepository.findByCriteria({
                isDisabled: false,
            });

            return ok(nodes);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
