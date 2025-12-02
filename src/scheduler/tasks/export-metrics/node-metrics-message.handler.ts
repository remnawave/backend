import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

import {
    DenormalizeMessage,
    IMessageHandler,
    MessageHandler,
    MessageResponse,
} from '@nestjstools/messaging';
import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { resolveCountryEmoji } from '@common/utils/resolve-country-emoji';
import { ICommandResponse } from '@common/types/command-response.type';
import { MessagingMessages, METRIC_NAMES } from '@libs/contracts/constants';

import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid/get-node-by-uuid.query';
import { NodesEntity } from '@modules/nodes/entities/nodes.entity';

import { NodeMetricsMessage } from './node-metrics.message.interface';

@Injectable()
@MessageHandler(MessagingMessages.NODE_METRICS)
export class NodeMetricsMessageHandler implements IMessageHandler<NodeMetricsMessage> {
    private readonly logger = new Logger(NodeMetricsMessageHandler.name);

    constructor(
        @InjectMetric(METRIC_NAMES.NODE_INBOUND_UPLOAD_BYTES)
        public nodeInboundUploadBytes: Counter<string>,
        @InjectMetric(METRIC_NAMES.NODE_INBOUND_DOWNLOAD_BYTES)
        public nodeInboundDownloadBytes: Counter<string>,
        @InjectMetric(METRIC_NAMES.NODE_OUTBOUND_UPLOAD_BYTES)
        public nodeOutboundUploadBytes: Counter<string>,
        @InjectMetric(METRIC_NAMES.NODE_OUTBOUND_DOWNLOAD_BYTES)
        public nodeOutboundDownloadBytes: Counter<string>,
        private readonly queryBus: QueryBus,
    ) {}

    async handle(@DenormalizeMessage() message: NodeMetricsMessage): Promise<MessageResponse> {
        try {
            const { nodeUuid, inbounds, outbounds } = message.nodeMetrics;
            const node = await this.getNodeByUuid(nodeUuid);
            if (!node.isOk || !node.response) {
                return new MessageResponse([{ result: 'NODE_NOT_FOUND' }]);
            }

            const { name, countryCode, uuid, provider, tags } = node.response;

            const countryEmoji = resolveCountryEmoji(countryCode);
            const nodeTags = tags.join(',');

            inbounds.forEach((inbound) => {
                this.nodeInboundUploadBytes.inc(
                    {
                        node_uuid: uuid,
                        node_name: name,
                        node_country_emoji: countryEmoji,
                        tag: inbound.tag,
                        provider_name: provider?.name || 'unknown',
                        tags: nodeTags,
                    },
                    Number(inbound.uplink),
                );

                this.nodeInboundDownloadBytes.inc(
                    {
                        node_uuid: uuid,
                        node_name: name,
                        node_country_emoji: countryEmoji,
                        tag: inbound.tag,
                        provider_name: provider?.name || 'unknown',
                        tags: nodeTags,
                    },
                    Number(inbound.downlink),
                );
            });

            outbounds.forEach((outbound) => {
                this.nodeOutboundUploadBytes.inc(
                    {
                        node_uuid: uuid,
                        node_name: name,
                        node_country_emoji: countryEmoji,
                        tag: outbound.tag,
                        provider_name: provider?.name || 'unknown',
                        tags: nodeTags,
                    },
                    Number(outbound.uplink),
                );

                this.nodeOutboundDownloadBytes.inc(
                    {
                        node_uuid: uuid,
                        node_name: name,
                        node_country_emoji: countryEmoji,
                        tag: outbound.tag,
                        provider_name: provider?.name || 'unknown',
                        tags: nodeTags,
                    },
                    Number(outbound.downlink),
                );
            });

            return new MessageResponse([{ result: 'OK' }]);
        } catch (error) {
            this.logger.error(`Error in handle: ${error}`);

            return new MessageResponse([{ result: 'ERROR' }]);
        }
    }

    private async getNodeByUuid(uuid: string): Promise<ICommandResponse<NodesEntity | null>> {
        return this.queryBus.execute<GetNodeByUuidQuery, ICommandResponse<NodesEntity | null>>(
            new GetNodeByUuidQuery(uuid),
        );
    }
}
