import { z } from 'zod';

import { RESET_PERIODS, USERS_STATUS } from '../constants';

export const SubscriptionInfoSchema = z.object({
    isFound: z.boolean(),
    user: z.object({
        shortUuid: z.string(),
        daysLeft: z.number(),
        trafficUsed: z.string(),
        trafficLimit: z.string(),
        lifetimeTrafficUsed: z.string(),
        trafficUsedBytes: z.string(),
        trafficLimitBytes: z.string(),
        lifetimeTrafficUsedBytes: z.string(),
        username: z.string(),
        expiresAt: z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
        isActive: z.boolean(),
        userStatus: z.nativeEnum(USERS_STATUS),
        trafficLimitStrategy: z.nativeEnum(RESET_PERIODS),
    }),
    links: z.array(z.string()),
    ssConfLinks: z.record(z.string(), z.string()),
    subscriptionUrl: z.string(),
});
