export const SYSTEM_CONTROLLER = 'system' as const;

export const SYSTEM_ROUTES = {
    STATS: {
        SYSTEM_STATS: 'stats',
        BANDWIDTH_STATS: 'stats/bandwidth',
        NODES_STATS: 'stats/nodes',
        RECAP: 'stats/recap',
        DIGEST: 'stats/digest',
        NODES_METRICS: 'nodes/metrics',
        HTTP: 'stats/http',
    },
    TOOLS: {
        GENERATE_X25519: 'tools/x25519/generate',
    },
    HEALTH: 'health',
    METADATA: 'metadata',
    CONFIGURATION: 'configuration',
    TESTERS: {
        SRR_MATCHER: 'testers/srr-matcher',
    },
} as const;
