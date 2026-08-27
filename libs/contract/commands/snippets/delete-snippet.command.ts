import { z } from 'zod';

import { REST_API, SNIPPETS_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace DeleteSnippetCommand {
    export const url = REST_API.SNIPPETS.DELETE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SNIPPETS_ROUTES.DELETE,
        'delete',
        'Delete snippet',
        { scope: 'delete', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(255, 'Name must be less than 255 characters')
            .regex(
                /^[A-Za-z0-9_ -]+(\/[A-Za-z0-9_ -]+)*$/,
                'Name can only contain letters, numbers, underscores, dashes, slashes and spaces',
            ),
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
}
