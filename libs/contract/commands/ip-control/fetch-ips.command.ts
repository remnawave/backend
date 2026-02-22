import { z } from 'zod';

import { IP_CONTROL_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace FetchIpsCommand {
    export const url = REST_API.IP_CONTROL.FETCH_IPS;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        IP_CONTROL_ROUTES.FETCH_IPS(':uuid'),
        'post',
        'Request IP List for User',
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
