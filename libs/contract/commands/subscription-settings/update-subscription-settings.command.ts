import { z } from 'zod';

import {
    HwidSettingsSchema,
    ResponseRulesConfigSchema,
    SubscriptionSettingsSchema,
} from '../../models';
import { REST_API, SUBSCRIPTION_SETTINGS_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace UpdateSubscriptionSettingsCommand {
    export const url = REST_API.SUBSCRIPTION_SETTINGS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_SETTINGS_ROUTES.UPDATE,
        'patch',
        'Update subscription settings',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),

        profileTitle: z.optional(z.string()),
        supportLink: z.optional(z.string()),
        profileUpdateInterval: z.optional(z.number().int()),
        isProfileWebpageUrlEnabled: z.optional(z.boolean()),
        serveJsonAtBaseSubscription: z.optional(z.boolean()),
        addUsernameToBaseSubscription: z.optional(z.boolean()),
        isShowCustomRemarks: z.optional(z.boolean()),

        happAnnounce: z.optional(
            z
                .string()
                .max(200, { message: 'Announce must be less than 200 characters' })
                .nullable(),
        ),
        happRouting: z.optional(z.string().nullable()),

        expiredUsersRemarks: z.optional(z.array(z.string())),
        limitedUsersRemarks: z.optional(z.array(z.string())),
        disabledUsersRemarks: z.optional(z.array(z.string())),

        customResponseHeaders: z.optional(
            z.record(
                z
                    .string()
                    .regex(
                        /^[a-zA-Z0-9_-]+$/,
                        'Invalid header name. Only letters(a-z, A-Z), numbers(0-9), underscores(_) and hyphens(-) are allowed.',
                    ),
                z.string(),
            ),
        ),

        randomizeHosts: z.optional(z.boolean()),

        responseRules: z.optional(ResponseRulesConfigSchema),
        hwidSettings: z.optional(HwidSettingsSchema),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: SubscriptionSettingsSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
