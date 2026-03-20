import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { NodePluginSchema } from '../../models';

export namespace GetNodePluginCommand {
    export const url = REST_API.NODE_PLUGINS.GET;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.GET(':uuid'),
        'get',
        'Get Node Plugin by uuid',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: NodePluginSchema.extend({
            pluginConfig: z.unknown(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
