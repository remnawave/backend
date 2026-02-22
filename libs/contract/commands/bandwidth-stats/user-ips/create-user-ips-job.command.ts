import { z } from 'zod';

import { BANDWIDTH_STATS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace CreateUserIpsJobCommand {
    export const url = REST_API.BANDWIDTH_STATS.USER_IPS.CREATE;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        BANDWIDTH_STATS_ROUTES.USER_IPS.CREATE(':uuid'),
        'post',
        'Request User IP List',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            jobId: z.string(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
