import { z } from 'zod';

import { SUBSCRIPTION_PAGE_CONFIGS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetSubpageConfigsTagsCommand {
    export const url = REST_API.SUBSCRIPTION_PAGE_CONFIGS.TAGS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_PAGE_CONFIGS_ROUTES.TAGS.GET,
        'get',
        'Get tags of Subpage Configs',
        { scope: 'list-tags', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            tags: z.array(z.string()),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
