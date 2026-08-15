import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AbuseBlockerStoredReportSchema } from '../../../models';

export namespace GetAbuseBlockerReportsCommand {
    export const url = REST_API.NODE_PLUGINS.ABUSE_BLOCKER.GET_REPORTS;
    export const TSQ_url = url;
    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.ABUSE_BLOCKER.GET_REPORTS,
        'get',
        'Get Abuse Blocker Reports',
        { scope: 'abuse-blocker-reports', kind: 'read' },
    );

    export const RequestQuerySchema = z
        .object({
            start: z.coerce.number().int().min(0).default(0),
            size: z.coerce.number().int().min(1).max(500).default(50),
            userId: z.coerce.number().int().positive().optional(),
            nodeUuid: z.uuid().optional(),
            severity: z.enum(['suspicious', 'alert', 'blocked']).optional(),
            rule: z.enum(['horizontal_scan', 'destination_sweep']).optional(),
            action: z.enum(['none', 'initial_block', 'repeat_block', 'disabled']).optional(),
            dateFrom: z.coerce.date().optional(),
            dateTo: z.coerce.date().optional(),
        })
        .refine((query) => !query.dateFrom || !query.dateTo || query.dateFrom <= query.dateTo, {
            message: 'dateFrom must be before or equal to dateTo.',
            path: ['dateTo'],
        });
    export const ResponseSchema = z.object({
        response: z.object({
            records: z.array(AbuseBlockerStoredReportSchema),
            total: z.number(),
        }),
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
