import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';
import { Logger } from '@nestjs/common';
import { GetEnabledNodesQuery } from './get-enabled-nodes.query';
import { NodesRepository } from '../../repositories/nodes.repository';
import { NodesEntity } from '../../entities/nodes.entity';

@QueryHandler(GetEnabledNodesQuery)
export class GetEnabledNodesHandler
    implements IQueryHandler<GetEnabledNodesQuery, ICommandResponse<NodesEntity[]>>
{
    private readonly logger = new Logger(GetEnabledNodesHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(): Promise<ICommandResponse<NodesEntity[]>> {
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