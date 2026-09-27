import { z } from 'zod';

import { BANDWIDTH_STATS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { numberParamSchema } from '../../../models';

export namespace GetInboundUserUsageCommand {
    export const url = REST_API.BANDWIDTH_STATS.INBOUNDS.USER_USAGE;
    export const TSQ_url = url(':uuid', ':userId');

    export const endpointDetails = getEndpointDetails(
        BANDWIDTH_STATS_ROUTES.INBOUNDS.USER_USAGE(':uuid', ':userId'),
        'get',
        'Get a single user daily traffic usage on this inbound for a period',
        { scope: 'inbound-user-usage', kind: 'read' },
        'Returns the daily traffic usage for a single user on this inbound over the period. Every day in the range is present (zero-filled). Underlying usage data is flushed to the database roughly every 2 minutes.',
    );

    export const RequestParamSchema = z.object({
        uuid: z.uuid().describe('Config profile inbound UUID'),
        userId: numberParamSchema,
    });

    export const RequestQuerySchema = z.object({
        start: z.iso.date().describe('Start date (YYYY-MM-DD)'),
        end: z.iso.date().describe('End date (YYYY-MM-DD)'),
    });

    export const ResponseSchema = z.object({
        response: z.object({
            days: z.array(
                z.object({
                    date: z.string().describe('Day (YYYY-MM-DD)'),
                    totalBytes: z
                        .number()
                        .describe('Used bytes on this inbound that day (raw bytes)'),
                }),
            ),
        }),
    });

    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type RequestQuery = z.infer<typeof RequestQuerySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
