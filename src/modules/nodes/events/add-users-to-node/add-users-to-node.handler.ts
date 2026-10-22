import { Logger } from '@nestjs/common';
import { IEventHandler, QueryBus } from '@nestjs/cqrs';
import { EventsHandler } from '@nestjs/cqrs';

import { AddUserCommand as AddUserToNodeCommandSdk } from '@remnawave/node-contract';

import { buildClientEmail } from '@common/helpers/xray-config/client-email';
import {
    getCipherTypeFromString,
    getSsPassword,
    isSS2022Method,
} from '@common/helpers/xray-config/ss-cipher';
import { getVlessFlowFromDbInbound } from '@common/utils/flow/get-vless-flow';

import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities';
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
                new GetUsersWithResolvedInboundsQuery(event.ids),
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
                const nodeConnectionOpts = {
                    address: node.address,
                    port: node.port,
                    proxyUrl: node.proxyUrl,
                };

                const usersToRemove: { id: bigint; vlessUuid: string }[] = [];
                const pendingRequests: Promise<unknown>[] = [];

                for (const user of usersResult.response) {
                    const { id, trojanPassword, vlessUuid, ssPassword, inbounds } = user;

                    if (inbounds.length === 0) continue;

                    const filteredInbounds = inbounds.filter((ib) => activeTags.has(ib.tag));

                    // AddUsersCommand cannot carry a different email for each inbound,
                    // so this path sends one request per user.
                    if (filteredInbounds.length === 0) {
                        usersToRemove.push({ id, vlessUuid });
                        continue;
                    }

                    const userData: AddUserToNodeCommandSdk.Request = {
                        hashData: { vlessUuid },
                        data: filteredInbounds.map((inbound) => {
                            const inboundType = this.resolveInboundType(inbound);
                            const username = buildClientEmail(id, inbound.uuid);

                            switch (inboundType) {
                                case 'trojan':
                                    return {
                                        type: inboundType,
                                        tag: inbound.tag,
                                        username,
                                        password: trojanPassword,
                                    };
                                case 'vless':
                                    return {
                                        type: inboundType,
                                        tag: inbound.tag,
                                        username,
                                        uuid: vlessUuid,
                                        flow: getVlessFlowFromDbInbound(inbound),
                                    };
                                case 'hysteria':
                                    return {
                                        type: inboundType,
                                        tag: inbound.tag,
                                        username,
                                        password: vlessUuid,
                                    };
                                case 'shadowsocks':
                                    return {
                                        type: inboundType,
                                        tag: inbound.tag,
                                        username,
                                        password: ssPassword,
                                        cipherType: getCipherTypeFromString(inbound.rawInbound),
                                        ivCheck: false,
                                    };
                                case 'shadowsocks22':
                                    return {
                                        type: inboundType,
                                        tag: inbound.tag,
                                        username,
                                        password: getSsPassword(ssPassword, true),
                                    };
                                default:
                                    throw new Error(`Unsupported inbound type: ${inboundType}`);
                            }
                        }),
                    };

                    pendingRequests.push(
                        this.nodesQueuesService.addUserToNode({
                            data: userData,
                            cleanupInbounds: node.activeInbounds.map(({ uuid, tag }) => ({
                                uuid,
                                tag,
                            })),
                            node: nodeConnectionOpts,
                        }),
                    );
                }

                if (usersToRemove.length > 0) {
                    pendingRequests.push(
                        this.nodesQueuesService.removeUsersFromNode({
                            data: {
                                users: usersToRemove.map((user) => ({
                                    userId: user.id.toString(),
                                    hashUuid: user.vlessUuid,
                                })),
                            },
                            node: nodeConnectionOpts,
                            cleanupInbounds: node.activeInbounds.map(({ uuid, tag }) => ({
                                uuid,
                                tag,
                            })),
                        }),
                    );
                }

                await Promise.all(pendingRequests);
            }
        } catch (error) {
            this.logger.error(`Error in Event AddUsersToNodeHandler: ${error}`);
        }
    }

    private resolveInboundType(inbound: ConfigProfileInboundEntity): string {
        if (inbound.type === 'shadowsocks' && isSS2022Method(inbound.rawInbound)) {
            return 'shadowsocks22';
        }
        return inbound.type;
    }
}
