import { z } from 'zod';

import { BANDWIDTH_STATS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetStatsNodesRealtimeUsageCommand {
    export const url = REST_API.BANDWIDTH_STATS.NODES.GET_REALTIME;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        BANDWIDTH_STATS_ROUTES.NODES.GET_REALTIME,
        'get',
        'Get Nodes Realtime Usage',
    );

    export const ResponseSchema = z.object({
        response: z.array(
            z.object({
                nodeUuid: z.string().uuid(),
                nodeName: z.string(),
                countryCode: z.string(),
                downloadBytes: z.number(),
                uploadBytes: z.number(),
                totalBytes: z.number(),
                downloadSpeedBps: z.number(),
                uploadSpeedBps: z.number(),
                totalSpeedBps: z.number(),
            }),
        ),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
