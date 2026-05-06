import { z } from 'zod';

import { BANDWIDTH_STATS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetStatsNodesUsersUsageCommand {
    export const url = REST_API.BANDWIDTH_STATS.NODES.GET_USERS_BY_NODES;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        BANDWIDTH_STATS_ROUTES.NODES.GET_USERS_BY_NODES,
        'post',
        'Get Nodes Users Usage by Nodes UUIDs',
    );

    export const RequestQuerySchema = z.object({
        start: z.string().date(),
        end: z.string().date(),
        topUsersLimit: z.coerce.number().min(1).default(100),
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const RequestSchema = z.object({
        nodesUuids: z.array(z.string().uuid()),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            categories: z.array(z.string()),
            sparklineData: z.array(z.number()),
            topUsers: z.array(
                z.object({
                    color: z.string(),
                    username: z.string(),
                    total: z.number(),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
