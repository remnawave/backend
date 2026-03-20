import { z } from 'zod';

import { ExtendedUsersSchema, ResolvedProxyConfigSchema } from '../../../models';
import { REST_API, SUBSCRIPTIONS_ROUTES } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetRawSubscriptionByShortUuidCommand {
    export const url = REST_API.SUBSCRIPTIONS.GET_BY.SHORT_UUID_RAW;
    export const TSQ_url = url(':shortUuid');

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTIONS_ROUTES.GET_BY.SHORT_UUID_RAW(':shortUuid'),
        'get',
        'Get Raw Subscription by Short UUID',
    );

    export const RequestSchema = z.object({
        shortUuid: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const RequestQuerySchema = z.object({
        withDisabledHosts: z
            .string()
            .transform((str) => str === 'true')
            .optional()
            .default('false'),
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            user: ExtendedUsersSchema,
            convertedUserInfo: z.object({
                daysLeft: z.number(),
                trafficLimit: z.string(),
                trafficUsed: z.string(),
                lifetimeTrafficUsed: z.string(),
                isHwidLimited: z.boolean(),
            }),
            headers: z.record(z.string(), z.string().optional()),
            resolvedProxyConfigs: z.array(ResolvedProxyConfigSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
