import { z } from 'zod';

import { REST_API, SNIPPETS_ROUTES } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace SyncSnippetCommand {
    export const url = REST_API.SNIPPETS.ACTIONS.SYNC;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SNIPPETS_ROUTES.ACTIONS.SYNC,
        'post',
        'Sync snippet to affected config profiles',
        { scope: 'sync', kind: 'write' },
        'Trigger the sync of a snippet to all config profiles that reference it. Nodes which use affected config profiles will be restarted.',
    );

    export const RequestBodySchema = z.object({
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(255, 'Name must be less than 255 characters')
            .regex(
                /^[A-Za-z0-9_\s-]+$/,
                'Name can only contain letters, numbers, underscores, dashes and spaces',
            ),
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
}
