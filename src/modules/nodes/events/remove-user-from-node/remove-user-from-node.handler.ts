import { IEventHandler, EventsHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { RemoveUserCommand as RemoveUserFromNodeCommandSdk } from '@remnawave/node-contract';

import { NodesQueuesService } from '@queue/_nodes';

import { RemoveUserFromNodeEvent } from './remove-user-from-node.event';
import { NodesRepository } from '../../repositories/nodes.repository';

@EventsHandler(RemoveUserFromNodeEvent)
export class RemoveUserFromNodeHandler implements IEventHandler<RemoveUserFromNodeEvent> {
    public readonly logger = new Logger(RemoveUserFromNodeHandler.name);

    constructor(
        private readonly nodesRepository: NodesRepository,
        private readonly nodesQueuesService: NodesQueuesService,
    ) {}
    async handle(event: RemoveUserFromNodeEvent) {
        try {
            // BDT-27: Exit-node logs show recurring /node/handler/remove-user 400s
            // with { username: undefined, hashData: undefined } at root. The
            // RemoveUserCommand schema requires both, so something is firing
            // this event without hydrated fields. Fail-fast here with full
            // context so we can identify the bad caller on the next occurrence,
            // instead of the node silently rejecting the payload.
            if (event.tId === undefined || event.tId === null || event.vlessUuid === undefined || event.vlessUuid === null || event.vlessUuid === '') {
                this.logger.error(
                    `BDT-27: RemoveUserFromNodeEvent fired with missing fields — refusing to send. ` +
                        `tId=${String(event.tId)} vlessUuid=${String(event.vlessUuid)}`,
                );
                return;
            }

            const nodes = await this.nodesRepository.findConnectedNodesWithoutInbounds();

            if (nodes.length === 0) {
                return;
            }

            const userData: RemoveUserFromNodeCommandSdk.Request = {
                username: event.tId.toString(),
                hashData: {
                    vlessUuid: event.vlessUuid,
                },
            };

            await this.nodesQueuesService.removeUserFromNodeBulk(
                nodes.map((node) => ({
                    data: userData,
                    node: {
                        address: node.address,
                        port: node.port,
                    },
                })),
            );

            return;
        } catch (error) {
            this.logger.error(`Error in Event RemoveUserFromNodeHandler: ${error}`);
        }
    }
}
