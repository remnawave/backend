import { IEventHandler, QueryBus } from '@nestjs/cqrs';
import { EventsHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { AddUserCommand as AddUserToNodeCommandSdk, CipherType } from '@remnawave/node-contract';

import { getVlessFlowFromDbInbound } from '@common/utils/flow/get-vless-flow';

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
                this.logger.error(
                    `BDT-27: AddUserToNode failed to resolve user ${event.userUuid}. ` +
                        `New user will not be pushed to any xray — they will see "connected, no internet".`,
                );
                return;
            }

            const { tId, trojanPassword, vlessUuid, ssPassword, inbounds } = userEntity.response;

            if (inbounds.length === 0) {
                this.logger.error(
                    `BDT-27: AddUserToNode: user tId=${tId} has no resolved inbounds (no active internal squads or no squad→inbound mapping). ` +
                        `User will NOT be pushed to any xray. Check the user's internal_squad_members rows and internal_squad_inbounds linkage.`,
                );
                return;
            }

            const nodes = await this.nodesRepository.findConnectedNodes();

            if (nodes.length === 0) {
                this.logger.error(
                    `BDT-27: AddUserToNode: no connected nodes found while trying to push tId=${tId}. ` +
                        `User created in DB but not pushed to any xray. Check node connectivity.`,
                );
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
                                cipherType: CipherType.CHACHA20_POLY1305,
                                ivCheck: false,
                            };
                        default:
                            throw new Error(`Unsupported inbound type: ${inboundType}`);
                    }
                }),
            };

            let pushedToAny = false;

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

                pushedToAny = true;

                await this.nodesQueuesService.addUserToNode({
                    data: filteredData,
                    node: {
                        address: node.address,
                        port: node.port,
                    },
                });
            }

            if (!pushedToAny) {
                // Every connected node either had activeInbounds.length === 0, no
                // activeConfigProfileUuid, or zero tag-overlap with the user's
                // resolved inbounds. User stays in DB/squad but is never added to
                // any xray → "connected, no internet" on the client. This is the
                // new-user breakage mode behind BDT-27 whenever it isn't a field
                // hydration miss.
                this.logger.error(
                    `BDT-27: AddUserToNode: user tId=${tId} not pushed to any of ${nodes.length} connected nodes. ` +
                        `Possible causes: node.activeInbounds empty, no activeConfigProfileUuid, or no tag overlap ` +
                        `between user squads and node inbounds. User-tags=[${userData.data
                            .map((d) => d.tag)
                            .join(',')}]. Run docker restart remnawave-node on each exit as a one-shot workaround ` +
                        `(reloads from DB), and investigate squad/inbound wiring.`,
                );
            }

            return;
        } catch (error) {
            this.logger.error(`Error in Event AddUserToNodeHandler: ${error}`);
        }
    }
}
