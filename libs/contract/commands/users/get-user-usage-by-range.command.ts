import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { REST_API, USERS_ROUTES } from '../../api';

export namespace GetUserUsageByRangeCommand {
    export const url = REST_API.USERS.STATS.GET_USAGE_BY_RANGE;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.STATS.GET_USAGE_BY_RANGE(':uuid'),
        'get',
        'Get user usage by range',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const RequestQuerySchema = z.object({
        start: z.string(),
        end: z.string(),
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.array(
            z.object({
                userUuid: z.string().uuid(),
                nodeUuid: z.string().uuid(),
                nodeName: z.string(),
                total: z.number(),
                date: z.string().transform((str) => new Date(str)),
            }),
        ),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
