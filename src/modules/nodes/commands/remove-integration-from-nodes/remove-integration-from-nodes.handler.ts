import { ERRORS } from '@contract/constants';

import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';

import { NodesRepository } from '@modules/nodes/repositories/nodes.repository';

import { RemoveIntegrationFromNodesCommand } from './remove-integration-from-nodes.command';

@CommandHandler(RemoveIntegrationFromNodesCommand)
export class RemoveIntegrationFromNodesHandler implements ICommandHandler<
    RemoveIntegrationFromNodesCommand,
    TResult<boolean>
> {
    public readonly logger = new Logger(RemoveIntegrationFromNodesHandler.name);

    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(command: RemoveIntegrationFromNodesCommand): Promise<TResult<boolean>> {
        try {
            await this.nodesRepository.removeIntegrationFromNodes(command.integrationUuid);

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
