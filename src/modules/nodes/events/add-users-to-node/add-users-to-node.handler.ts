import { IEventHandler, QueryBus } from '@nestjs/cqrs';
import { EventsHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { AddUsersCommand as AddUsersToNodeCommandSdk } from '@remnawave/node-contract';

import { getVlessFlowFromDbInbound } from '@common/utils/flow/get-vless-flow';

import { GetUsersWithResolvedInboundsQuery } from '@modules/users/queries/get-users-with-resolved-inbounds';

import { NodesQueuesService } from '@queue/_nodes';

import { NodesRepository } from '../../repositories/nodes.repository';
import { AddUsersToNodeEvent } from './add-users-to-node.event';

@EventsHandler(AddUsersToNodeEvent)
export class AddUsersToNodeHandler implements IEventHandler<AddUsersToNodeEvent> {
    public readonly logger = new Logger(AddUsersToNodeHandler.name);

    constructor(
        private readonly nodesRepository: NodesRepository,
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly queryBus: QueryBus,
    ) {}

    async handle(event: AddUsersToNodeEvent) {
        try {
            const nodes = await this.nodesRepository.findConnectedNodes();

            if (nodes.length === 0) {
                return;
            }

            const usersResult = await this.queryBus.execute(
                new GetUsersWithResolvedInboundsQuery(event.tIds),
            );

            if (!usersResult.isOk || usersResult.response.length === 0) {
                return;
            }

            const activeNodes = nodes.filter(
                (node) => node.activeInbounds.length > 0 && node.activeConfigProfileUuid,
            );

            if (activeNodes.length === 0) return;

            for (const node of activeNodes) {
                const activeTags = new Set(node.activeInbounds.map((ib) => ib.tag));

                const usersForNode: AddUsersToNodeCommandSdk.Request['users'] = [];
                const usersToRemove: Array<{ userId: string; hashUuid: string }> = [];

                for (const user of usersResult.response) {
                    const { tId, trojanPassword, vlessUuid, ssPassword, inbounds } = user;

                    if (inbounds.length === 0) continue;

                    const filteredInbounds = inbounds.filter((ib) => activeTags.has(ib.tag));

                    if (filteredInbounds.length === 0) {
                        usersToRemove.push({ userId: tId.toString(), hashUuid: vlessUuid });
                        continue;
                    }

                    usersForNode.push({
                        userData: {
                            userId: tId.toString(),
                            hashUuid: vlessUuid,
                            vlessUuid,
                            trojanPassword,
                            ssPassword,
                        },
                        inboundData: filteredInbounds.map((inbound) => {
                            switch (inbound.type) {
                                case 'trojan':
                                    return { type: inbound.type, tag: inbound.tag };
                                case 'vless':
                                    return {
                                        type: inbound.type,
                                        tag: inbound.tag,
                                        flow: getVlessFlowFromDbInbound(inbound),
                                    };
                                case 'shadowsocks':
                                    return { type: inbound.type, tag: inbound.tag };
                                default:
                                    throw new Error(`Unsupported inbound type: ${inbound.type}`);
                            }
                        }),
                    });
                }

                if (usersForNode.length > 0) {
                    const affectedInboundTags = [...activeTags];

                    await this.nodesQueuesService.addUsersToNode({
                        data: {
                            affectedInboundTags,
                            users: usersForNode,
                        },
                        node: { address: node.address, port: node.port },
                    });
                }

                if (usersToRemove.length > 0) {
                    await this.nodesQueuesService.removeUsersFromNode({
                        data: {
                            users: usersToRemove.map((u) => ({
                                userId: u.userId,
                                hashUuid: u.hashUuid,
                            })),
                        },
                        node: { address: node.address, port: node.port },
                    });
                }
            }
        } catch (error) {
            this.logger.error(`Error in Event AddUsersToNodeHandler: ${error}`);
        }
    }
}
