import { z } from 'zod';

import { BANDWIDTH_STATS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetStatsNodesUsageCommand {
    export const url = REST_API.BANDWIDTH_STATS.NODES.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        BANDWIDTH_STATS_ROUTES.NODES.GET,
        'get',
        'Get Nodes Usage by Range',
    );

    export const RequestQuerySchema = z.object({
        start: z.string().date(),
        end: z.string().date(),
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
