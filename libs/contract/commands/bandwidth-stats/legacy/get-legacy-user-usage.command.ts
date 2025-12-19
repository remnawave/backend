import { z } from 'zod';

import { BANDWIDTH_STATS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetLegacyStatsUserUsageCommand {
    export const url = REST_API.BANDWIDTH_STATS.LEGACY.USERS.GET_BY_UUID;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        BANDWIDTH_STATS_ROUTES.LEGACY.USERS.GET_BY_UUID(':uuid'),
        'get',
        'Get User Usage by Range (Legacy)',
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
                countryCode: z.string(),
                total: z.number(),
                date: z.string().transform((str) => new Date(str)),
            }),
        ),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
