import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { SharedListNameSchema } from '../../../models';

export namespace SyncSharedListCommand {
    export const url = REST_API.NODE_PLUGINS.SHARED_LISTS.ACTIONS.SYNC;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.SHARED_LISTS.ACTIONS.SYNC,
        'post',
        'Sync Shared List to nodes',
        { scope: 'shared-lists-sync', kind: 'write' },
        'Push every plugin referencing this shared list to the nodes it is active on.',
    );

    export const RequestBodySchema = z.object({
        name: SharedListNameSchema,
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
}
