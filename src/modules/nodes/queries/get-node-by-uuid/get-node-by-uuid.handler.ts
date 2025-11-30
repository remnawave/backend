import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { NodesRepository } from '../../repositories/nodes.repository';
import { GetNodeByUuidQuery } from './get-node-by-uuid.query';
import { NodesEntity } from '../../entities/nodes.entity';

@QueryHandler(GetNodeByUuidQuery)
export class GetNodeByUuidHandler implements IQueryHandler<
    GetNodeByUuidQuery,
    ICommandResponse<NodesEntity | null>
> {
    private readonly logger = new Logger(GetNodeByUuidHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(query: GetNodeByUuidQuery): Promise<ICommandResponse<NodesEntity | null>> {
        try {
            const node = await this.nodesRepository.findByUUID(query.uuid);

            return {
                isOk: true,
                response: node,
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
