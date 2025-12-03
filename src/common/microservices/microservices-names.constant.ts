export const MICROSERVICES_NAMES = {
    REDIS_PRODUCER: 'REDIS_PRODUCER',
} as const;

export type TMicroservicesNames = typeof MICROSERVICES_NAMES;

export const MESSAGING_NAMES = {
    NODE_METRICS: 'NODE_METRICS',
} as const;

export type TMessagingNames = typeof MESSAGING_NAMES;
