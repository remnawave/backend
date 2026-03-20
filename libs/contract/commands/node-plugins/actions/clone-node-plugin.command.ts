import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { NodePluginSchema } from '../../../models';

export namespace CloneNodePluginCommand {
    export const url = REST_API.NODE_PLUGINS.ACTIONS.CLONE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.ACTIONS.CLONE,
        'post',
        'Clone Node Plugin',
    );

    export const RequestSchema = z.object({
        cloneFromUuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: NodePluginSchema.extend({
            pluginConfig: z.unknown(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
