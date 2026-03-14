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
        name: METRIC_NAMES.PROCESS_RSS_BYTES,
        help: 'Process resident set size in bytes.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.PROCESS_HEAP_USED_BYTES,
        help: 'Process heap used in bytes.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.PROCESS_HEAP_TOTAL_BYTES,
        help: 'Process total heap size in bytes.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.PROCESS_EXTERNAL_BYTES,
        help: 'Process external memory in bytes (C++ objects bound to JS).',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.PROCESS_ARRAY_BUFFERS_BYTES,
        help: 'Process ArrayBuffers memory in bytes.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.PROCESS_EVENT_LOOP_DELAY_MS,
        help: 'Mean event loop delay in milliseconds.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.PROCESS_EVENT_LOOP_P99_MS,
        help: 'Event loop delay p99 in milliseconds.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.PROCESS_ACTIVE_HANDLES,
        help: 'Number of active resource handles.',
        labelNames: ['instance_id', 'instance_name'],
    }),
    makeGaugeProvider({
        name: METRIC_NAMES.PROCESS_UPTIME_SECONDS,
        help: 'Process uptime in seconds.',
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
