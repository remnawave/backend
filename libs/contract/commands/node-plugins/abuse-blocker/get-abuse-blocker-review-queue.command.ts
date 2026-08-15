import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AbuseBlockerReviewStateSchema } from '../../../models';

export namespace GetAbuseBlockerReviewQueueCommand {
    export const url = REST_API.NODE_PLUGINS.ABUSE_BLOCKER.GET_REVIEW_QUEUE;
    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.ABUSE_BLOCKER.GET_REVIEW_QUEUE,
        'get',
        'Get Abuse Blocker Manual Review Queue',
        { scope: 'abuse-blocker-reports', kind: 'read' },
    );
    export const RequestQuerySchema = z.object({
        start: z.coerce.number().int().min(0).default(0),
        size: z.coerce.number().int().min(1).max(500).default(50),
    });
    export const ResponseSchema = z.object({
        response: z.object({ records: z.array(AbuseBlockerReviewStateSchema), total: z.number() }),
    });
    export type RequestQuery = z.infer<typeof RequestQuerySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
