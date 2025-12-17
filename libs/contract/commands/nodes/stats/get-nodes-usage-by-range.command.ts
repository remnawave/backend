import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { NODES_ROUTES, REST_API } from '../../../api';

export namespace GetNodesUsageByRangeCommand {
    export const url = REST_API.NODES.STATS.USAGE_BY_RANGE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.STATS.USAGE_BY_RANGE,
        'get',
        'Get nodes usage by range',
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
