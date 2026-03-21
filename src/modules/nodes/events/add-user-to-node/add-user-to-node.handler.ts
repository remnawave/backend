import { IEventHandler, QueryBus } from '@nestjs/cqrs';
import { EventsHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { AddUserCommand as AddUserToNodeCommandSdk } from '@remnawave/node-contract';

import {
    getCipherTypeFromString,
    getSsPassword,
    isSS2022Method,
} from '@common/helpers/xray-config/ss-cipher';
import { getVlessFlowFromDbInbound } from '@common/utils/flow/get-vless-flow';

import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities/config-profile-inbound.entity';
import { GetUserWithResolvedInboundsQuery } from '@modules/users/queries/get-user-with-resolved-inbounds';

import { NodesQueuesService } from '@queue/_nodes';

import { NodesRepository } from '../../repositories/nodes.repository';
import { AddUserToNodeEvent } from './add-user-to-node.event';

@EventsHandler(AddUserToNodeEvent)
export class AddUserToNodeHandler implements IEventHandler<AddUserToNodeEvent> {
    public readonly logger = new Logger(AddUserToNodeHandler.name);

    constructor(
        private readonly nodesRepository: NodesRepository,
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly queryBus: QueryBus,
    ) {}
    async handle(event: AddUserToNodeEvent) {
        try {
            const userEntity = await this.queryBus.execute(
                new GetUserWithResolvedInboundsQuery(event.userUuid),
            );

            if (!userEntity.isOk) {
                return;
            }

            const { tId, trojanPassword, vlessUuid, ssPassword, inbounds } = userEntity.response;

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
                    const inboundType = this.resolveInboundType(inbound);

                    switch (inboundType) {
                        case 'trojan':
                            return {
                                type: inboundType,
                                username: tId.toString(),
                                password: trojanPassword,
                                tag: inbound.tag,
                            };
                        case 'vless':
                            return {
                                type: inboundType,
                                username: tId.toString(),
                                uuid: vlessUuid,
                                flow: getVlessFlowFromDbInbound(inbound),
                                tag: inbound.tag,
                            };
                        case 'shadowsocks':
                            return {
                                type: inboundType,
                                username: tId.toString(),
                                password: ssPassword,
                                tag: inbound.tag,
                                cipherType: getCipherTypeFromString(inbound.rawInbound),
                                ivCheck: false,
                            };
                        case 'shadowsocks22':
                            return {
                                type: inboundType,
                                username: tId.toString(),
                                password: getSsPassword(ssPassword, true),
                                tag: inbound.tag,
                            };
                        case 'hysteria':
                            return {
                                type: inboundType,
                                username: tId.toString(),
                                password: vlessUuid,
                                tag: inbound.tag,
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
                    await this.nodesQueuesService.removeUserFromNode({
                        data: {
                            username: tId.toString(),
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

                await this.nodesQueuesService.addUserToNode({
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

    private resolveInboundType(inbound: ConfigProfileInboundEntity): string {
        if (inbound.type === 'shadowsocks' && isSS2022Method(inbound.rawInbound)) {
            return 'shadowsocks22';
        }
        return inbound.type;
    }
}
