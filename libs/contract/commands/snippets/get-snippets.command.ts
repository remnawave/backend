import { z } from 'zod';

import { REST_API, SNIPPETS_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';
import { SnippetsSchema } from '../../models';

export namespace GetSnippetsCommand {
    export const url = REST_API.SNIPPETS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(SNIPPETS_ROUTES.GET, 'get', 'Get snippets');

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            snippets: z.array(SnippetsSchema),
        }),
    });
    export type Response = z.infer<typeof ResponseSchema>;
}
