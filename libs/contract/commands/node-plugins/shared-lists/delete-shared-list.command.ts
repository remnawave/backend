import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { SharedListNameSchema } from '../../../models';

export namespace DeleteSharedListCommand {
    export const url = REST_API.NODE_PLUGINS.SHARED_LISTS.DELETE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.SHARED_LISTS.DELETE,
        'delete',
        'Delete Shared List by name',
        { scope: 'shared-lists-delete', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        name: SharedListNameSchema,
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
}
