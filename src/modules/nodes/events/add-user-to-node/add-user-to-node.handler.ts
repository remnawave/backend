import { IEventHandler, QueryBus } from '@nestjs/cqrs';
import { EventsHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import {
    AddUserCommand as AddUserToNodeCommandSdk,
    CipherType,
} from '@remnawave/node-contract/build/commands';

import { getVlessFlowFromDbInbound } from '@common/utils/flow/get-vless-flow';

import { GetUserWithResolvedInboundsQuery } from '@modules/users/queries/get-user-with-resolved-inbounds';

import { NodeUsersQueueService } from '@queue/node-users/node-users.service';

import { NodesRepository } from '../../repositories/nodes.repository';
import { AddUserToNodeEvent } from './add-user-to-node.event';

@EventsHandler(AddUserToNodeEvent)
export class AddUserToNodeHandler implements IEventHandler<AddUserToNodeEvent> {
    public readonly logger = new Logger(AddUserToNodeHandler.name);

    constructor(
        private readonly nodesRepository: NodesRepository,
        private readonly nodeUsersQueue: NodeUsersQueueService,
        private readonly queryBus: QueryBus,
    ) {}
    async handle(event: AddUserToNodeEvent) {
        try {
            const userEntity = await this.queryBus.execute(
                new GetUserWithResolvedInboundsQuery(event.userUuid),
            );

            if (!userEntity.isOk || !userEntity.response) {
                return;
            }

            const { username, trojanPassword, vlessUuid, ssPassword, inbounds } =
                userEntity.response;

            if (inbounds.length === 0) {
                return;
            }

            const nodes = await this.nodesRepository.findConnectedNodes();

            if (nodes.length === 0) {
                return;
            }

            const userData: AddUserToNodeCommandSdk.Request = {
                hashData: {
                    vlessUuid,
                    prevVlessUuid: event.prevVlessUuid,
                },

                data: inbounds.map((inbound) => {
                    const inboundType = inbound.type;

                    switch (inboundType) {
                        case 'trojan':
                            return {
                                type: inboundType,
                                username: username,
                                password: trojanPassword,
                                level: 0,
                                tag: inbound.tag,
                            };
                        case 'vless':
                            return {
                                type: inboundType,
                                username: username,
                                uuid: vlessUuid,
                                flow: getVlessFlowFromDbInbound(inbound),
                                level: 0,
                                tag: inbound.tag,
                            };
                        case 'shadowsocks':
                            return {
                                type: inboundType,
                                username: username,
                                password: ssPassword,
                                level: 0,
                                tag: inbound.tag,
                                cipherType: CipherType.CHACHA20_POLY1305,
                                ivCheck: false,
                            };
                        default:
                            throw new Error(`Unsupported inbound type: ${inboundType}`);
                    }
                }),
            };

            for (const node of nodes) {
                if (node.activeInbounds.length === 0 || !node.activeConfigProfileUuid) {
                    continue;
                }

                const activeTags = new Set(node.activeInbounds.map((inbound) => inbound.tag));

                const filteredData = {
                    ...userData,
                    data: userData.data.filter((item) => activeTags.has(item.tag)),
                };

                if (filteredData.data.length === 0) {
                    await this.nodeUsersQueue.removeUserFromNode({
                        data: {
                            username: username,
                            hashData: {
                                vlessUuid: event.prevVlessUuid || vlessUuid,
                            },
                        },
                        node: {
                            address: node.address,
                            port: node.port,
                        },
                    });

                    continue;
                }

                await this.nodeUsersQueue.addUsersToNode({
                    data: filteredData,
                    node: {
                        address: node.address,
                        port: node.port,
                    },
                });
            }

            return;
        } catch (error) {
            this.logger.error(`Error in Event AddUserToNodeHandler: ${error}`);
        }
    }
}
