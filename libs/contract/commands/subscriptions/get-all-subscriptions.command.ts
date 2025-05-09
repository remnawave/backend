import { z } from 'zod';

import { getEndpointDetails, RESET_PERIODS, USERS_STATUS } from '../../constants';
import { REST_API, SUBSCRIPTIONS_ROUTES } from '../../api';

export namespace GetAllSubscriptionsCommand {
    export const url = REST_API.SUBSCRIPTIONS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTIONS_ROUTES.GET,
        'get',
        'Get all subscriptions',
    );

    export const RequestQuerySchema = z.object({
        start: z.coerce
            .number()
            .default(0)
            .describe('Start index (offset) of the users to return, default is 0'),
        size: z.coerce
            .number()
            .min(1, 'Size (limit) must be greater than 0')
            .max(500, 'Size (limit) must be less than 500')
            .describe('Number of subscriptions to return, no more than 500')
            .default(25),
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            subscriptions: z.array(
                z.object({
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
            ),
            total: z.number(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
