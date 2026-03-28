import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { NodePluginSchema } from '../../models';

export namespace GetNodePluginsCommand {
    export const url = REST_API.NODE_PLUGINS.GET_ALL;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.GET_ALL,
        'get',
        'Get all Node Plugins',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            nodePlugins: z.array(NodePluginSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
