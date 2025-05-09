import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { NODES_ROUTES, REST_API } from '../../api';
import { NodesSchema } from '../../models';

export namespace GetAllNodesCommand {
    export const url = REST_API.NODES.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(NODES_ROUTES.GET, 'get', 'Get all nodes');

    export const ResponseSchema = z.object({
        response: z.array(NodesSchema),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
