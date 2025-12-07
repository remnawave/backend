import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { NODES_ROUTES, REST_API } from '../../../api';

export namespace BulkNodesProfileModificationCommand {
    export const url = REST_API.NODES.BULK_ACTIONS.PROFILE_MODIFICATION;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.BULK_ACTIONS.PROFILE_MODIFICATION,
        'post',
        'Modify Inbounds & Profile for many nodes',
    );

    export const RequestSchema = z.object({
        uuids: z.array(z.string().uuid()).min(1, 'Must be at least 1 Node UUID'),
        configProfile: z.object({
            activeConfigProfileUuid: z.string().uuid(),
            activeInbounds: z
                .array(z.string().uuid(), {
                    invalid_type_error: 'Must be an array of UUIDs',
                })
                .min(1, 'Must be at least 1 inbound UUID'),
        }),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            eventSent: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
