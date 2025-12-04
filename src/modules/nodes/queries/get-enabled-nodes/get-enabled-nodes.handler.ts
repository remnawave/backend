import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesRepository } from '../../repositories/nodes.repository';
import { GetEnabledNodesQuery } from './get-enabled-nodes.query';
import { NodesEntity } from '../../entities/nodes.entity';

@QueryHandler(GetEnabledNodesQuery)
export class GetEnabledNodesHandler implements IQueryHandler<
    GetEnabledNodesQuery,
    TResult<NodesEntity[]>
> {
    private readonly logger = new Logger(GetEnabledNodesHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(): Promise<TResult<NodesEntity[]>> {
        try {
            const nodes = await this.nodesRepository.findByCriteria({
                isDisabled: false,
            });

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
