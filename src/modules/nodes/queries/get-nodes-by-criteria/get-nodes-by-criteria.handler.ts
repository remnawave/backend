import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetNodesByCriteriaQuery } from './get-nodes-by-criteria.query';
import { NodesRepository } from '../../repositories/nodes.repository';
import { NodesEntity } from '../../entities/nodes.entity';

@QueryHandler(GetNodesByCriteriaQuery)
export class GetNodesByCriteriaHandler implements IQueryHandler<
    GetNodesByCriteriaQuery,
    TResult<NodesEntity[]>
> {
    private readonly logger = new Logger(GetNodesByCriteriaHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(query: GetNodesByCriteriaQuery): Promise<TResult<NodesEntity[]>> {
        try {
            const nodes = await this.nodesRepository.findByCriteria(query.criteria);

            return ok(nodes);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
