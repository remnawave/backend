import { z } from 'zod';

import { CONFIG_PROFILES_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetConfigProfilesTagsCommand {
    export const url = REST_API.CONFIG_PROFILES.TAGS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        CONFIG_PROFILES_ROUTES.TAGS.GET,
        'get',
        'Get tags of Config Profiles',
        { scope: 'list-tags', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            tags: z.array(z.string()),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
