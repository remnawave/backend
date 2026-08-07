import { InjectRedis } from '@songkeys/nestjs-redis';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import Redis from 'ioredis';
import { Counter } from 'prom-client';

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { TypedConfigService } from '@common/config/app-config';
import { getRedisChannelName } from '@common/utils';
import { METRIC_NAMES } from '@libs/contracts/constants';

import { INodeMetrics, NODE_METRICS_MESSAGE_CHANNEL } from './node-metrics.message.interface';

@Injectable()
export class NodeMetricsSubscriber implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(NodeMetricsSubscriber.name);

    private readonly channel: string;

    private subscriber: Redis;

    constructor(
        @InjectRedis() private readonly redis: Redis,
        configService: TypedConfigService,
        @InjectMetric(METRIC_NAMES.NODE_INBOUND_UPLOAD_BYTES)
        public nodeInboundUploadBytes: Counter<string>,
        @InjectMetric(METRIC_NAMES.NODE_INBOUND_DOWNLOAD_BYTES)
        public nodeInboundDownloadBytes: Counter<string>,
        @InjectMetric(METRIC_NAMES.NODE_OUTBOUND_UPLOAD_BYTES)
        public nodeOutboundUploadBytes: Counter<string>,
        @InjectMetric(METRIC_NAMES.NODE_OUTBOUND_DOWNLOAD_BYTES)
        public nodeOutboundDownloadBytes: Counter<string>,
    ) {
        this.channel = getRedisChannelName(configService, NODE_METRICS_MESSAGE_CHANNEL);
    }

    async onModuleInit() {
        this.subscriber = this.redis.duplicate();

        this.subscriber.on('error', (err) => {
            this.logger.error(`Node metrics subscriber error: ${err.message}`);
        });

        this.subscriber.on('message', (_channel, message) => {
            void this.handleNodeMetricsMessage(message);
        });

        const count = await this.subscriber.subscribe(this.channel);
        this.logger.log(`Subscribed to ${this.channel} (active subscriptions: ${count})`);
    }

    private handleNodeMetricsMessage(value: string) {
        try {
            const nodeMetrics = JSON.parse(value) as INodeMetrics;

            const { nodeUuid, inbounds, outbounds } = nodeMetrics;

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
        } catch (error) {
            this.logger.error(`Error handling node metrics message: ${error}`);
        }
    }

    async onModuleDestroy() {
        await this.subscriber.quit();
    }
}
