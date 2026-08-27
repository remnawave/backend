import { z } from 'zod';

import { SUBSCRIPTION_PAGE_CONFIGS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { TagsSchema } from '../../../models';

export namespace SetSubpageConfigTagsCommand {
    export const url = REST_API.SUBSCRIPTION_PAGE_CONFIGS.TAGS.SET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_PAGE_CONFIGS_ROUTES.TAGS.SET,
        'patch',
        'Set tags of Subpage Config',
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
