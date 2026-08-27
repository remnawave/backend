import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { SharedListNameSchema, SharedListsSchema } from '../../../models';

export namespace GetSharedListCommand {
    export const url = REST_API.NODE_PLUGINS.SHARED_LISTS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.SHARED_LISTS.GET,
        'get',
        'Get Shared List by name',
        { scope: 'shared-lists-get', kind: 'read' },
    );

    export const RequestQuerySchema = z.object({
        name: SharedListNameSchema,
    });

    export const ResponseSchema = z.object({
        response: SharedListsSchema,
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
