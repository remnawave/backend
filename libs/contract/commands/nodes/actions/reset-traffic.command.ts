import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { NODES_ROUTES, REST_API } from '../../../api';

export namespace ResetNodeTrafficCommand {
    export const url = REST_API.NODES.ACTIONS.RESET_TRAFFIC;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.ACTIONS.RESET_TRAFFIC(':uuid'),
        'post',
        'Reset Node Traffic',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            eventSent: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
