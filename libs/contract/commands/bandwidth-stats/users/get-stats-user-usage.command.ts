import { z } from 'zod';

import { BANDWIDTH_STATS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetStatsUserUsageCommand {
    export const url = REST_API.BANDWIDTH_STATS.USERS.GET_BY_UUID;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        BANDWIDTH_STATS_ROUTES.USERS.GET_BY_UUID(':uuid'),
        'get',
        'Get User Usage by Range',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const RequestQuerySchema = z.object({
        start: z.string().date(),
        end: z.string().date(),
        topNodesLimit: z.coerce.number().min(1).default(20),
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            categories: z.array(z.string()),
            sparklineData: z.array(z.number()),
            topNodes: z.array(
                z.object({
                    uuid: z.string().uuid(),
                    color: z.string(),
                    name: z.string(),
                    countryCode: z.string(),
                    total: z.number(),
                }),
            ),
            series: z.array(
                z.object({
                    uuid: z.string().uuid(),
                    name: z.string(),
                    color: z.string(),
                    countryCode: z.string(),
                    total: z.number(),
                    data: z.array(z.number()),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
