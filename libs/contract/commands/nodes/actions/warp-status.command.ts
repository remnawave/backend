import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { NODES_ROUTES, REST_API } from '../../../api';
import { WarpStatusSchema } from '../../../models';

export namespace GetNodeWarpStatusCommand {
    export const url = REST_API.NODES.ACTIONS.WARP.STATUS;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.ACTIONS.WARP.STATUS(':uuid'),
        'get',
        'Get WARP status for a node',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: WarpStatusSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
