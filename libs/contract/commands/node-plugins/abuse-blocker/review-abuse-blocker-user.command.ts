import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AbuseBlockerReviewStateSchema } from '../../../models';

export namespace ReviewAbuseBlockerUserCommand {
    export const url = REST_API.NODE_PLUGINS.ABUSE_BLOCKER.REVIEW;
    export const TSQ_url = url(':userUuid');
    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.ABUSE_BLOCKER.REVIEW,
        'post',
        'Resolve Abuse Blocker Manual Review',
        { scope: 'abuse-blocker-reports', kind: 'write' },
    );
    export const RequestParamSchema = z.object({
        userUuid: z.uuid().describe('User VLESS UUID used by the current Users model.'),
    });
    export const RequestBodySchema = z.object({ action: z.enum(['enable', 'keep_disabled']) });
    export const ResponseSchema = z.object({ response: AbuseBlockerReviewStateSchema });
    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
