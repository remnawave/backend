import { z } from 'zod';

import { INBOUNDS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace AddInboundToNodesCommand {
    export const url = REST_API.INBOUNDS.BULK.ADD_INBOUND_TO_NODES;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        INBOUNDS_ROUTES.BULK.ADD_INBOUND_TO_NODES,
        'post',
        'Add inbound to nodes',
    );

    export const RequestSchema = z.object({
        inboundUuid: z
            .string({
                invalid_type_error: 'Inbound UUID must be a string',
            })
            .uuid('Inbound UUID must be a valid UUID'),
    });
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isSuccess: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
