import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetAbuseBlockerStatsCommand {
    export const url = REST_API.NODE_PLUGINS.ABUSE_BLOCKER.GET_REPORTS_STATS;
    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.ABUSE_BLOCKER.GET_REPORTS_STATS,
        'get',
        'Get Abuse Blocker Statistics',
        { scope: 'abuse-blocker-reports', kind: 'read' },
    );
    export const ResponseSchema = z.object({
        response: z.object({
            totalReports: z.number(),
            reportsLast24Hours: z.number(),
            distinctUsers: z.number(),
            distinctNodes: z.number(),
            manualReviewRequired: z.number(),
            bySeverity: z.object({
                suspicious: z.number(),
                alert: z.number(),
                blocked: z.number(),
            }),
            topUsers: z.array(
                z.object({ userId: z.number(), username: z.string(), total: z.number() }),
            ),
            topNodes: z.array(
                z.object({
                    uuid: z.uuid(),
                    name: z.string(),
                    countryCode: z.string(),
                    total: z.number(),
                }),
            ),
        }),
    });
    export type Response = z.infer<typeof ResponseSchema>;
}
