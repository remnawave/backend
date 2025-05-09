import { z } from 'zod';

import { getEndpointDetails, RESET_PERIODS, USERS_STATUS } from '../../../constants';
import { REST_API, SUBSCRIPTIONS_ROUTES } from '../../../api';

export namespace GetSubscriptionByUsernameCommand {
    export const url = REST_API.SUBSCRIPTIONS.GET_BY.USERNAME;
    export const TSQ_url = url(':username');

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTIONS_ROUTES.GET_BY.USERNAME(':username'),
        'get',
        'Get subscription by username',
    );

    export const RequestSchema = z.object({
        username: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isFound: z.boolean(),
            user: z.object({
                shortUuid: z.string(),
                daysLeft: z.number(),
                trafficUsed: z.string(),
                trafficLimit: z.string(),
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
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
