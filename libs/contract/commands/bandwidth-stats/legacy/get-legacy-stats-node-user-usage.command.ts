import { z } from 'zod';

import { BANDWIDTH_STATS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetLegacyStatsNodeUserUsageCommand {
    export const url = REST_API.BANDWIDTH_STATS.LEGACY.NODES.GET_USERS;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        BANDWIDTH_STATS_ROUTES.LEGACY.NODES.GET_USERS(':uuid'),
        'get',
        'Get Node User Usage by Range and Node UUID (Legacy)',
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
