import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { REST_API, USERS_ROUTES } from '../../api';

export namespace GetUserSubscriptionRequestHistoryCommand {
    export const url = REST_API.USERS.SUBSCRIPTION_REQUEST_HISTORY;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.SUBSCRIPTION_REQUEST_HISTORY(':uuid'),
        'get',
        'Get user subscription request history, recent 24 records',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            records: z.array(
                z.object({
                    id: z.number(),
                    userId: z.number(),
                    requestAt: z
                        .string()
                        .datetime()
                        .transform((str) => new Date(str)),
                    requestIp: z.string().optional().nullable(),
                    userAgent: z.string().optional().nullable(),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
