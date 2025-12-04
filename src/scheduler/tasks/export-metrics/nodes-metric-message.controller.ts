import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

import { EventPattern } from '@nestjs/microservices';
import { Controller, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { resolveCountryEmoji } from '@common/utils/resolve-country-emoji';
import { MESSAGING_NAMES } from '@common/microservices';
import { METRIC_NAMES } from '@libs/contracts/constants';

import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid/get-node-by-uuid.query';

import { INodeMetrics } from './node-metrics.message.interface';

@Controller()
export class NodesMetricMessageController {
    private readonly logger = new Logger(NodesMetricMessageController.name);

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

    @EventPattern(MESSAGING_NAMES.NODE_METRICS)
    async handleNodesMetricMessage(message: INodeMetrics) {
        try {
            const { nodeUuid, inbounds, outbounds } = message;
            const nodeResponse = await this.queryBus.execute(new GetNodeByUuidQuery(nodeUuid));

            if (!nodeResponse.isOk) {
                return;
            }

            const { name, countryCode, uuid, provider, tags } = nodeResponse.response;

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

            return;
        } catch (error) {
            this.logger.error(`Error in handle: ${error}`);

            return;
        }
    }
}
