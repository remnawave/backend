import { z } from 'zod';

import { BANDWIDTH_STATS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetUserIpsResultCommand {
    export const url = REST_API.BANDWIDTH_STATS.USER_IPS.GET_RESULT;
    export const TSQ_url = url(':jobId');

    export const endpointDetails = getEndpointDetails(
        BANDWIDTH_STATS_ROUTES.USER_IPS.GET_RESULT(':jobId'),
        'get',
        'Get User IP List Result by Job ID',
    );

    export const RequestSchema = z.object({
        jobId: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isCompleted: z.boolean(),
            isFailed: z.boolean(),
            progress: z.object({
                total: z.number(),
                completed: z.number(),
                percent: z.number(),
            }),
            result: z
                .object({
                    success: z.boolean(),
                    userUuid: z.string().uuid(),
                    userId: z.string(),
                    nodes: z.array(
                        z.object({
                            nodeUuid: z.string().uuid(),
                            nodeName: z.string(),
                            countryCode: z.string(),
                            ips: z.array(z.string()),
                        }),
                    ),
                })
                .nullable(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
