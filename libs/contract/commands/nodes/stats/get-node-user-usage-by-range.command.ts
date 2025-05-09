import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { NODES_ROUTES, REST_API } from '../../../api';

export namespace GetNodeUserUsageByRangeCommand {
    export const url = REST_API.NODES.STATS.USAGE_BY_RANGE_USER;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.STATS.USAGE_BY_RANGE_USER(':uuid'),
        'get',
        'Get node user usage by range and Node UUID',
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
                username: z.string(),
                nodeUuid: z.string().uuid(),
                total: z.number(),
                date: z.string().transform((str) => new Date(str)),
            }),
        ),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
