import { z } from 'zod';

import { REST_API, SUBSCRIPTION_REQUEST_HISTORY_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace GetSubscriptionRequestHistoryStatsCommand {
    export const url = REST_API.SUBSCRIPTION_REQUEST_HISTORY.STATS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_REQUEST_HISTORY_ROUTES.STATS,
        'get',
        'Get subscription request history stats',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            byParsedApp: z.array(
                z.object({
                    app: z.string(),
                    count: z.number(),
                }),
            ),
            hourlyRequestStats: z.array(
                z.object({
                    dateTime: z
                        .string()
                        .datetime()
                        .transform((str) => new Date(str)),
                    requestCount: z.number(),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
