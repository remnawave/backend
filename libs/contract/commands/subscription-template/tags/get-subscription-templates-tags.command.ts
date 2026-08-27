import { z } from 'zod';

import { SUBSCRIPTION_TEMPLATE_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetSubscriptionTemplatesTagsCommand {
    export const url = REST_API.SUBSCRIPTION_TEMPLATE.TAGS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_TEMPLATE_ROUTES.TAGS.GET,
        'get',
        'Get tags of Subscription Templates',
        { scope: 'list-tags', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            tags: z.array(z.string()),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
