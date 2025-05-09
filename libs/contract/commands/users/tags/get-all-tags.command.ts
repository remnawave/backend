import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace GetAllTagsCommand {
    export const url = REST_API.USERS.TAGS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.TAGS.GET,
        'get',
        'Get all existing user tags',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            tags: z.array(z.string()),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
