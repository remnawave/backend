import { z } from 'zod';

import { SUBSCRIPTION_TEMPLATE_TYPE } from '../constants';
import {
    ExternalSquadSubscriptionSettingsSchema,
    ExternalSquadHostOverridesSchema,
    ExternalSquadResponseHeadersAddSchema,
    ExternalSquadResponseHeadersRemoveSchema,
} from './external-squads';
import { HwidSettingsSchema, CustomRemarksSchema } from './subscription-settings';

export const ExternalSquadSchema = z.object({
    uuid: z.uuid(),
    viewPosition: z.int(),
    name: z.string(),
    tags: z.array(z.string()),

    info: z.object({
        membersCount: z.number(),
    }),

    templates: z.array(
        z.object({
            templateUuid: z.uuid(),
            templateType: z.enum(SUBSCRIPTION_TEMPLATE_TYPE),
        }),
    ),
    subscriptionSettings: z.nullable(ExternalSquadSubscriptionSettingsSchema),
    hostOverrides: z.nullable(ExternalSquadHostOverridesSchema),
    responseHeadersAdd: ExternalSquadResponseHeadersAddSchema,
    responseHeadersRemove: ExternalSquadResponseHeadersRemoveSchema,
    hwidSettings: z.nullable(HwidSettingsSchema),
    customRemarks: z.nullable(CustomRemarksSchema),
    subpageConfigUuid: z.nullable(z.uuid()),

    createdAt: z.iso.datetime().transform((str) => new Date(str)),
    updatedAt: z.iso.datetime().transform((str) => new Date(str)),
});
