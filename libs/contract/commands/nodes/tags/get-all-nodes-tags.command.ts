import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { REST_API, NODES_ROUTES } from '../../../api';

export namespace GetAllNodesTagsCommand {
    export const url = REST_API.NODES.TAGS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.TAGS.GET,
        'get',
        'Get all existing nodes tags',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            tags: z.array(z.string()),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
