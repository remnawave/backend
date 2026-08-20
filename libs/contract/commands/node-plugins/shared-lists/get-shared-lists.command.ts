import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { SharedListPreviewSchema } from '../../../models';

export namespace GetSharedListsCommand {
    export const url = REST_API.NODE_PLUGINS.SHARED_LISTS.GET_ALL;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.SHARED_LISTS.GET_ALL,
        'get',
        'Get Shared Lists (Preview)',
        { scope: 'shared-lists-list', kind: 'read' },
        'Returns only the name, type and item count of every shared list. Use "Get Shared List by name" to fetch the items themselves.',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            sharedLists: z.array(SharedListPreviewSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
