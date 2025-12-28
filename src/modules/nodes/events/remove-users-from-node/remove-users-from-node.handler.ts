import { IEventHandler, EventsHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { RemoveUsersCommand as RemoveUsersFromNodeCommandSdk } from '@remnawave/node-contract';

import { NodesQueuesService } from '@queue/_nodes';

import { RemoveUsersFromNodeEvent } from './remove-users-from-node.event';
import { NodesRepository } from '../../repositories/nodes.repository';

@EventsHandler(RemoveUsersFromNodeEvent)
export class RemoveUsersFromNodeHandler implements IEventHandler<RemoveUsersFromNodeEvent> {
    public readonly logger = new Logger(RemoveUsersFromNodeHandler.name);

    constructor(
        private readonly nodesRepository: NodesRepository,
        private readonly nodesQueuesService: NodesQueuesService,
    ) {}
    async handle(event: RemoveUsersFromNodeEvent) {
        try {
            const nodes = await this.nodesRepository.findConnectedNodesWithoutInbounds();

            if (nodes.length === 0 || event.users.length === 0) {
                return;
            }

            const userData: RemoveUsersFromNodeCommandSdk.Request = {
                users: event.users.map((user) => ({
                    userId: user.tId.toString(),
                    hashUuid: user.vlessUuid,
                })),
            };

            for (const node of nodes) {
                await this.nodesQueuesService.removeUsersFromNode({
                    data: userData,
                    node: { address: node.address, port: node.port },
                });
            }

            return;
        } catch (error) {
            this.logger.error(`Error in Event RemoveUsersFromNodeHandler: ${error}`);
        }
    }
}
