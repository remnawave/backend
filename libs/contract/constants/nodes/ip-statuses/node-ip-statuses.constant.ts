export const NODE_IP_STATUSES = {
    INBOUND: 'INBOUND',
    OUTBOUND: 'OUTBOUND',
    MANAGEMENT: 'MANAGEMENT',
    TRANSIT: 'TRANSIT',
    MONITORING: 'MONITORING',
    RESERVE: 'RESERVE',
    BLOCKED: 'BLOCKED',
    FLAGGED: 'FLAGGED',
    DEPRECATED: 'DEPRECATED',
    UNKNOWN: 'UNKNOWN',
} as const;

export type TNodeIpStatus = [keyof typeof NODE_IP_STATUSES][number];
export const NODE_IP_STATUSES_VALUES = Object.values(NODE_IP_STATUSES);
export const NODE_IP_STATUSES_KEYS = Object.keys(NODE_IP_STATUSES) as TNodeIpStatus[];
