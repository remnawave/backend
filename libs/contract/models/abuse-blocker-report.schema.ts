import { z } from 'zod';

import { NodesSchema } from './nodes.schema';

export const AbuseBlockerStoredReportSchema = z.object({
    eventId: z.uuid(),
    userId: z.number(),
    nodeId: z.number(),
    severity: z.enum(['suspicious', 'alert', 'blocked']),
    score: z.number(),
    sourceIp: z.string(),
    action: z.enum(['none', 'initial_block', 'repeat_block', 'disabled']),
    detectedAt: z.coerce.date(),
    report: z.unknown(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    user: z.object({
        username: z.string(),
        vlessUuid: z.uuid(),
        status: z.string(),
    }),
    node: NodesSchema.pick({
        uuid: true,
        name: true,
        countryCode: true,
    }),
});

export const AbuseBlockerReviewStateSchema = z.object({
    userId: z.number(),
    strikeLevel: z.number(),
    lastBlockingIncidentAt: z.coerce.date().nullable(),
    manualReviewRequired: z.boolean(),
    disabledByPlugin: z.boolean(),
    reviewRequestedAt: z.coerce.date().nullable(),
    reviewedAt: z.coerce.date().nullable(),
    reviewAction: z.enum(['enable', 'keep_disabled']).nullable(),
    updatedAt: z.coerce.date(),
    user: z.object({
        username: z.string(),
        vlessUuid: z.uuid(),
        status: z.string(),
    }),
});
