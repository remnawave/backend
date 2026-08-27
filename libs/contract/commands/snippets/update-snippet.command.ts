import { z } from 'zod';

import { REST_API, SNIPPETS_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';
import { SnippetsSchema } from '../../models';

export namespace UpdateSnippetCommand {
    export const url = REST_API.SNIPPETS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SNIPPETS_ROUTES.UPDATE,
        'patch',
        'Update snippet',
        { scope: 'update', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        name: z
            .string()
            .min(2)
            .max(255)
            .regex(
                /^[A-Za-z0-9_ -]+(\/[A-Za-z0-9_ -]+)*$/,
                'Name can only contain letters, numbers, underscores, dashes, slashes and spaces',
            ),
        snippet: z.array(z.looseObject({})),
    });

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            snippets: z.array(SnippetsSchema),
        }),
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
