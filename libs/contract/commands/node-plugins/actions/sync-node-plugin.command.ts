import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace SyncNodePluginCommand {
    export const url = REST_API.NODE_PLUGINS.ACTIONS.SYNC;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.ACTIONS.SYNC,
        'post',
        'Sync Node Plugin to nodes',
        { scope: 'sync', kind: 'write' },
        'Push the current plugin config, including referenced shared lists, to every connected node this plugin is active on.',
    );

    export const RequestBodySchema = z.object({
        uuid: z.uuid(),
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
}
