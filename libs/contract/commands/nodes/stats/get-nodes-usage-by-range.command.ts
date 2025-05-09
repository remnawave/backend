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
        start: z.string(),
        end: z.string(),
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.array(
            z.object({
                nodeUuid: z.string().uuid(),
                nodeName: z.string(),
                total: z.number(),
                totalDownload: z.number(),
                totalUpload: z.number(),
                humanReadableTotal: z.string(),
                humanReadableTotalDownload: z.string(),
                humanReadableTotalUpload: z.string(),
                date: z.string().transform((str) => new Date(str)),
            }),
        ),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
