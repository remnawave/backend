import { makeCounterProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';

import { METRIC_NAMES } from '@libs/contracts/constants';

export const METRIC_PROVIDERS = [
    makeGaugeProvider({
        name: METRIC_NAMES.NODE_ONLINE_USERS,
        help: 'Number of online users on a node',
        labelNames: ['node_uuid', 'node_name', 'node_country_emoji', 'provider_name', 'tags'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODE_STATUS,
        help: 'Node connection status (1 - connected, 0 - disconnected)',
        labelNames: ['node_uuid', 'node_name', 'node_country_emoji', 'provider_name', 'tags'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.USERS_STATUS,
        help: 'Counter for users statuses, updated every 1 minute',
        labelNames: ['status'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.USERS_ONLINE_STATS,
        help: 'Counter for online stats of distinct users, updated every 1 minute',
        labelNames: ['metricType'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.USERS_TOTAL,
        help: 'Total number of users, updated every 1 minute',
        labelNames: ['type'],
    }),
    makeCounterProvider({
        name: METRIC_NAMES.NODE_INBOUND_UPLOAD_BYTES,
        help: 'Inbound upload bytes, updated every 30 seconds',
        labelNames: [
            'node_uuid',
            'node_name',
            'node_country_emoji',
            'tag',
            'provider_name',
            'tags',
        ],
    }),
    makeCounterProvider({
        name: METRIC_NAMES.NODE_INBOUND_DOWNLOAD_BYTES,
        help: 'Inbound download bytes, updated every 30 seconds',
        labelNames: [
            'node_uuid',
            'node_name',
            'node_country_emoji',
            'tag',
            'provider_name',
            'tags',
        ],
    }),
    makeCounterProvider({
        name: METRIC_NAMES.NODE_OUTBOUND_UPLOAD_BYTES,
        help: 'Outbound upload bytes, updated every 30 seconds',
        labelNames: [
            'node_uuid',
            'node_name',
            'node_country_emoji',
            'tag',
            'provider_name',
            'tags',
        ],
    }),
    makeCounterProvider({
        name: METRIC_NAMES.NODE_OUTBOUND_DOWNLOAD_BYTES,
        help: 'Outbound download bytes, updated every 30 seconds',
        labelNames: [
            'node_uuid',
            'node_name',
            'node_country_emoji',
            'tag',
            'provider_name',
            'tags',
        ],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_HEAP_USED_BYTES,
        help: 'Process heap size used from Node.js in bytes.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_HEAP_TOTAL_BYTES,
        help: 'Process total heap size from Node.js in bytes.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_HEAP_USAGE_PERCENT,
        help: 'Heap usage percentage from Node.js.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_ACTIVE_HANDLERS,
        help: 'Process active handlers.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_ACTIVE_REQUESTS,
        help: 'Process active requests.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_CPU_USAGE_PERCENT,
        help: 'Process CPU usage percentage.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_MEMORY_USAGE_BYTES,
        help: 'Process memory usage in bytes.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_EVENT_LOOP_LATENCY_P50,
        help: 'The 50th percentile of the recorded event loop delays. Milliseconds',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_EVENT_LOOP_LATENCY_P95,
        help: 'The 95th percentile of the recorded event loop delays. Milliseconds',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_HTTP_REQ_RATE,
        help: 'HTTPS requests per minute, req/min',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_HTTP_REQ_LATENCY_P95,
        help: 'HTTP request latency p95, in milliseconds',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.NODEJS_HTTP_REQ_LATENCY_P50,
        help: 'HTTP request latency p50, in milliseconds',
        labelNames: ['instance_id', 'instance_name'],
    }),
];

export interface INodeBaseMetricLabels {
    node_uuid: string;
    node_name: string;
    node_country_emoji: string;
    provider_name: string;
    tags: string;
}

export interface INodeBandwidthMetricLabels extends INodeBaseMetricLabels {
    tag: string;
}
