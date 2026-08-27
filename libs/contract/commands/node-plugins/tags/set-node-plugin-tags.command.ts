import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { TagsSchema } from '../../../models';

export namespace SetNodePluginTagsCommand {
    export const url = REST_API.NODE_PLUGINS.TAGS.SET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.TAGS.SET,
        'patch',
        'Set tags of Node Plugin',
        { scope: 'set-tags', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        uuid: z.uuid(),
        tags: TagsSchema,
    });

    export const ResponseSchema = z.object({
        response: z.object({
            uuid: z.uuid(),
            tags: z.array(z.string()),
        }),
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
