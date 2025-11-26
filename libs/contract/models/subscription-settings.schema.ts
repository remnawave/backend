import { z } from 'zod';

import { CustomRemarksSchema } from './subscription-settings/custom-remarks.schema';
import { HwidSettingsSchema } from './subscription-settings/hwid-settings.schema';
import { ResponseRulesConfigSchema } from './response-rules';

export const SubscriptionSettingsSchema = z.object({
    uuid: z.string().uuid(),

    profileTitle: z.string(),
    supportLink: z.string(),
    profileUpdateInterval: z
        .number()
        .int()
        .min(1, 'Profile update interval must be greater than 0'),

    isProfileWebpageUrlEnabled: z.boolean(),
    serveJsonAtBaseSubscription: z.boolean(),

    isShowCustomRemarks: z.boolean(),
    customRemarks: CustomRemarksSchema,

    happAnnounce: z.string().nullable(),
    happRouting: z.string().nullable(),

    customResponseHeaders: z.nullable(z.record(z.string(), z.string())),

    randomizeHosts: z.boolean(),

    responseRules: z.nullable(ResponseRulesConfigSchema),

    hwidSettings: z.nullable(HwidSettingsSchema),

    createdAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    updatedAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
});
