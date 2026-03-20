import { z } from 'zod';

import { IP_CONTROL_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace FetchUsersIpsCommand {
    export const url = REST_API.IP_CONTROL.FETCH_USERS_IPS;
    export const TSQ_url = url(':nodeUuid');

    export const endpointDetails = getEndpointDetails(
        IP_CONTROL_ROUTES.FETCH_USERS_IPS(':nodeUuid'),
        'post',
        'Request Users IPs List for Node',
    );

    export const RequestSchema = z.object({
        nodeUuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            jobId: z.string(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
