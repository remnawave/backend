import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { NODES_ROUTES, REST_API } from '../../../api';
import { NodesSchema } from '../../../models';

export namespace ReorderNodeCommand {
    export const url = REST_API.NODES.ACTIONS.REORDER;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.ACTIONS.REORDER,
        'post',
        'Reorder nodes',
    );

    export const RequestSchema = z.object({
        nodes: z.array(
            NodesSchema.pick({
                viewPosition: true,
                uuid: true,
            }),
        ),
    });
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.array(NodesSchema),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
