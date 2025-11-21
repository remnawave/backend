import { z } from 'zod';

import {
    ExternalSquadSubscriptionSettingsSchema,
    ExternalSquadHostOverridesSchema,
    ExternalSquadResponseHeadersSchema,
} from './external-squads';
import { HwidSettingsSchema, CustomRemarksSchema } from './subscription-settings';
import { SUBSCRIPTION_TEMPLATE_TYPE } from '../constants';

export const ExternalSquadSchema = z.object({
    uuid: z.string().uuid(),
    viewPosition: z.number().int(),
    name: z.string(),

    info: z.object({
        membersCount: z.number(),
    }),

    templates: z.array(
        z.object({
            templateUuid: z.string().uuid(),
            templateType: z.nativeEnum(SUBSCRIPTION_TEMPLATE_TYPE),
        }),
    ),
    subscriptionSettings: z.nullable(ExternalSquadSubscriptionSettingsSchema),
    hostOverrides: z.nullable(ExternalSquadHostOverridesSchema),
    responseHeaders: ExternalSquadResponseHeadersSchema,
    hwidSettings: z.nullable(HwidSettingsSchema),
    customRemarks: z.nullable(CustomRemarksSchema),

    createdAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    updatedAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
});
