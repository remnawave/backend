import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { HOSTS_ROUTES, REST_API } from '../../api';

export namespace DeleteHostCommand {
    export const url = REST_API.HOSTS.DELETE;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        HOSTS_ROUTES.DELETE(':uuid'),
        'delete',
        'Delete a host by UUID',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isDeleted: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
