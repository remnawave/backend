import { z } from 'zod';

import {
    ExternalSquadSubscriptionSettingsSchema,
    ExternalSquadHostOverridesSchema,
    ExternalSquadResponseHeadersSchema,
} from './external-squads';
import { SUBSCRIPTION_TEMPLATE_TYPE } from '../constants';

export const ExternalSquadSchema = z.object({
    uuid: z.string().uuid(),
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

    createdAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    updatedAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
});
