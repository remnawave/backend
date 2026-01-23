import { z } from 'zod';

import { getEndpointDetails, NODES_BULK_ACTIONS } from '../../../constants';
import { NODES_ROUTES, REST_API } from '../../../api';

export namespace BulkNodesActionsCommand {
    export const url = REST_API.NODES.BULK_ACTIONS.ACTIONS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.BULK_ACTIONS.ACTIONS,
        'post',
        'Perform actions for many nodes',
    );

    export const RequestSchema = z.object({
        uuids: z.array(z.string().uuid()).min(1, 'Must be at least 1 Node UUID'),
        action: z.nativeEnum(NODES_BULK_ACTIONS),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            eventSent: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
