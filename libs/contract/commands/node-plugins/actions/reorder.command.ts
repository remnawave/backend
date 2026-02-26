import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { NodePluginSchema } from '../../../models';

export namespace ReorderNodePluginCommand {
    export const url = REST_API.NODE_PLUGINS.ACTIONS.REORDER;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.ACTIONS.REORDER,
        'post',
        'Reorder Node Plugins',
    );

    export const RequestSchema = z.object({
        items: z.array(
            NodePluginSchema.pick({
                viewPosition: true,
                uuid: true,
            }),
        ),
    });
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            nodePlugins: z.array(NodePluginSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
