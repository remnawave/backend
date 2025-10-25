import { z } from 'zod';

import { REST_API, SNIPPETS_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';
import { SnippetsSchema } from '../../models';

export namespace CreateSnippetCommand {
    export const url = REST_API.SNIPPETS.CREATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SNIPPETS_ROUTES.CREATE,
        'post',
        'Create snippet',
    );

    export const RequestSchema = z.object({
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(255, 'Name must be less than 255 characters')
            .regex(
                /^[A-Za-z0-9_\s-]+$/,
                'Name can only contain letters, numbers, underscores, dashes and spaces',
            ),
        snippet: z.array(z.object({}).passthrough()),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            snippets: z.array(SnippetsSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
