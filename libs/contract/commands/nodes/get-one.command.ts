import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { NODES_ROUTES, REST_API } from '../../api';
import { NodesSchema } from '../../models';

export namespace GetOneNodeCommand {
    export const url = REST_API.NODES.GET_BY_UUID;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.GET_BY_UUID(':uuid'),
        'get',
        'Get node by UUID',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: NodesSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
