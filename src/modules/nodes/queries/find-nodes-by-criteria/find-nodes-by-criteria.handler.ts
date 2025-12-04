import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { FindNodesByCriteriaQuery } from './find-nodes-by-criteria.query';
import { NodesRepository } from '../../repositories/nodes.repository';
import { NodesEntity } from '../../entities/nodes.entity';

@QueryHandler(FindNodesByCriteriaQuery)
export class FindNodesByCriteriaHandler implements IQueryHandler<
    FindNodesByCriteriaQuery,
    TResult<NodesEntity[]>
> {
    private readonly logger = new Logger(FindNodesByCriteriaHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(query: FindNodesByCriteriaQuery): Promise<TResult<NodesEntity[]>> {
        try {
            const nodes = await this.nodesRepository.findByCriteriaPrisma(query.where);

            return {
                isOk: true,
                response: nodes,
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
