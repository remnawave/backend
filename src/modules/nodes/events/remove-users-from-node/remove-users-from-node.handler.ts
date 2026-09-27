import { Logger } from '@nestjs/common';
import { IEventHandler, EventsHandler } from '@nestjs/cqrs';

import { NodesQueuesService } from '@queue/_nodes';

import { NodesRepository } from '../../repositories/nodes.repository';
import { RemoveUsersFromNodeEvent } from './remove-users-from-node.event';

@EventsHandler(RemoveUsersFromNodeEvent)
export class RemoveUsersFromNodeHandler implements IEventHandler<RemoveUsersFromNodeEvent> {
    public readonly logger = new Logger(RemoveUsersFromNodeHandler.name);

    constructor(
        private readonly nodesRepository: NodesRepository,
        private readonly nodesQueuesService: NodesQueuesService,
    ) {}
    async handle(event: RemoveUsersFromNodeEvent) {
        try {
            const nodes = await this.nodesRepository.findConnectedNodes();

            if (nodes.length === 0 || event.users.length === 0) {
                return;
            }

            const requests: Promise<unknown>[] = [];

            for (const node of nodes) {
                requests.push(
                    this.nodesQueuesService.removeUsersFromNode({
                        data: {
                            users: event.users.map((user) => ({
                                userId: user.id.toString(),
                                hashUuid: user.vlessUuid,
                            })),
                        },
                        node: {
                            address: node.address,
                            port: node.port,
                            proxyUrl: node.proxyUrl,
                        },
                        cleanupInbounds: node.activeInbounds.map(({ uuid, tag }) => ({
                            uuid,
                            tag,
                        })),
                    }),
                );
            }

            await Promise.all(requests);

            return;
        } catch (error) {
            this.logger.error(`Error in Event RemoveUsersFromNodeHandler: ${error}`);
        }
    }
}
