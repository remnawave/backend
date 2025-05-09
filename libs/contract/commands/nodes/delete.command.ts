import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { NODES_ROUTES, REST_API } from '../../api';

export namespace DeleteNodeCommand {
    export const url = REST_API.NODES.DELETE;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.DELETE(':uuid'),
        'delete',
        'Delete a node',
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
