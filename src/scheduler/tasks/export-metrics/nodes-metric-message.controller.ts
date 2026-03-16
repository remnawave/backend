import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

import { EventPattern } from '@nestjs/microservices';
import { Controller, Logger } from '@nestjs/common';

import { MESSAGING_NAMES } from '@common/microservices';
import { METRIC_NAMES } from '@libs/contracts/constants';

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
    ) {}

    @EventPattern(MESSAGING_NAMES.NODE_METRICS)
    async handleNodesMetricMessage(message: INodeMetrics) {
        try {
            const { nodeUuid, inbounds, outbounds } = message;

            inbounds.forEach((inbound) => {
                this.nodeInboundUploadBytes.inc(
                    {
                        node_uuid: nodeUuid,
                        tag: inbound.tag,
                    },
                    Number(inbound.uplink),
                );

                this.nodeInboundDownloadBytes.inc(
                    {
                        node_uuid: nodeUuid,
                        tag: inbound.tag,
                    },
                    Number(inbound.downlink),
                );
            });

            outbounds.forEach((outbound) => {
                this.nodeOutboundUploadBytes.inc(
                    {
                        node_uuid: nodeUuid,
                        tag: outbound.tag,
                    },
                    Number(outbound.uplink),
                );

                this.nodeOutboundDownloadBytes.inc(
                    {
                        node_uuid: nodeUuid,
                        tag: outbound.tag,
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
