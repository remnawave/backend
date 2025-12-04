import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import {
    GetEnabledNodesPartialQuery,
    IGetEnabledNodesPartialResponse,
} from './get-enabled-nodes-partial.query';
import { NodesRepository } from '../../repositories/nodes.repository';

@QueryHandler(GetEnabledNodesPartialQuery)
export class GetEnabledNodesPartialHandler implements IQueryHandler<GetEnabledNodesPartialQuery> {
    private readonly logger = new Logger(GetEnabledNodesPartialHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(): Promise<TResult<IGetEnabledNodesPartialResponse[]>> {
        try {
            const nodes = await this.nodesRepository.findEnabledNodesPartial();

            return ok(nodes);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
