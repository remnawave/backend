import { z } from 'zod';

import { IP_CONTROL_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace FetchUsersIpsResultCommand {
    export const url = REST_API.IP_CONTROL.GET_FETCH_USERS_IPS_RESULT;
    export const TSQ_url = url(':jobId');

    export const endpointDetails = getEndpointDetails(
        IP_CONTROL_ROUTES.GET_FETCH_USERS_IPS_RESULT(':jobId'),
        'get',
        'Get Users IPs List Result by Job ID',
    );

    export const RequestSchema = z.object({
        jobId: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isCompleted: z.boolean(),
            isFailed: z.boolean(),
            result: z
                .object({
                    success: z.boolean(),
                    nodeUuid: z.string().uuid(),
                    users: z.array(
                        z.object({
                            userId: z.string(),
                            ips: z.array(
                                z.object({
                                    ip: z.string(),
                                    lastSeen: z
                                        .string()
                                        .datetime({
                                            local: true,
                                            offset: true,
                                        })
                                        .transform((str) => new Date(str)),
                                }),
                            ),
                        }),
                    ),
                })
                .nullable(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
