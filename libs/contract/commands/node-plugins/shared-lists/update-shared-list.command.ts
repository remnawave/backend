import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { SharedListNameSchema, SharedListsSchema } from '../../../models';

export namespace UpdateSharedListCommand {
    export const url = REST_API.NODE_PLUGINS.SHARED_LISTS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.SHARED_LISTS.UPDATE,
        'patch',
        'Update Shared List',
        { scope: 'shared-lists-update', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        name: SharedListNameSchema,
        config: z.record(z.string(), z.unknown()),
    });

    export const ResponseSchema = z.object({
        response: SharedListsSchema,
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
