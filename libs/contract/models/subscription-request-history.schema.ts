import { z } from 'zod';

export const SubscriptionRequestHistorySchema = z.object({
    id: z.number(),
    userId: z.number(),
    srrResponseType: z.string(),
    srrRuleName: z.nullable(z.string()),
    requestIp: z.nullable(z.string()),
    userAgent: z.nullable(z.string()),
    requestAt: z.iso.datetime().transform((str) => new Date(str)),
});
