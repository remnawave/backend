import { z } from 'zod';

import { REST_API, USERS_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';
import { numberParamSchema } from '../../models';

export namespace GetUserSubscriptionRequestHistoryCommand {
    export const url = REST_API.USERS.SUBSCRIPTION_REQUEST_HISTORY;
    export const TSQ_url = url(':userId');

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.SUBSCRIPTION_REQUEST_HISTORY(':userId'),
        'get',
        'Get user subscription request history, recent 24 records',
        { scope: 'subscription-request-history', kind: 'read' },
    );

    export const RequestParamSchema = z.object({
        userId: numberParamSchema,
    });

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            records: z.array(
                z.object({
                    id: z.number(),
                    userId: z.number(),
                    requestAt: z.iso.datetime().transform((str) => new Date(str)),
                    srrResponseType: z.string(),
                    requestIp: z.string().optional().nullable(),
                    userAgent: z.string().optional().nullable(),
                    srrRuleName: z.string().optional().nullable(),
                }),
            ),
        }),
    });

    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
