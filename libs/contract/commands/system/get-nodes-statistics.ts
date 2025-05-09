import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { REST_API, SYSTEM_ROUTES } from '../../api';

export namespace GetNodesStatisticsCommand {
    export const url = REST_API.SYSTEM.STATS.NODES_STATS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SYSTEM_ROUTES.STATS.NODES_STATS,
        'get',
        'Get Nodes Statistics',
    );

    export const RequestQuerySchema = z.object({
        tz: z.string().optional(),
    });

    export type Request = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            lastSevenDays: z.array(
                z.object({
                    nodeName: z.string(),
                    date: z.string(),
                    totalBytes: z.string(),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
