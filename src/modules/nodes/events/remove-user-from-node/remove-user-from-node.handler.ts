import { Logger } from '@nestjs/common';
import { IEventHandler, EventsHandler } from '@nestjs/cqrs';

import { NodesQueuesService } from '@queue/_nodes';

import { NodesRepository } from '../../repositories/nodes.repository';
import { RemoveUserFromNodeEvent } from './remove-user-from-node.event';

@EventsHandler(RemoveUserFromNodeEvent)
export class RemoveUserFromNodeHandler implements IEventHandler<RemoveUserFromNodeEvent> {
    public readonly logger = new Logger(RemoveUserFromNodeHandler.name);

    constructor(
        private readonly nodesRepository: NodesRepository,
        private readonly nodesQueuesService: NodesQueuesService,
    ) {}
    async handle(event: RemoveUserFromNodeEvent) {
        try {
            const nodes = await this.nodesRepository.findConnectedNodes();

            if (nodes.length === 0) {
                return;
            }

            await this.nodesQueuesService.removeUserFromNodeBulk(
                nodes.map((node) => ({
                    data: {
                        username: event.id.toString(),
                        hashData: {
                            vlessUuid: event.vlessUuid,
                        },
                    },
                    node: { address: node.address, port: node.port, proxyUrl: node.proxyUrl },
                    cleanupInbounds: node.activeInbounds.map(({ uuid, tag }) => ({ uuid, tag })),
                })),
            );

            return;
        } catch (error) {
            this.logger.error(`Error in Event RemoveUserFromNodeHandler: ${error}`);
        }
    }
}
