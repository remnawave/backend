import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { GetNodesByCriteriaQuery } from './get-nodes-by-criteria.query';
import { NodesRepository } from '../../repositories/nodes.repository';
import { NodesEntity } from '../../entities/nodes.entity';

@QueryHandler(GetNodesByCriteriaQuery)
export class GetNodesByCriteriaHandler implements IQueryHandler<
    GetNodesByCriteriaQuery,
    ICommandResponse<NodesEntity[]>
> {
    private readonly logger = new Logger(GetNodesByCriteriaHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(query: GetNodesByCriteriaQuery): Promise<ICommandResponse<NodesEntity[]>> {
        try {
            const nodes = await this.nodesRepository.findByCriteria(query.criteria);

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
