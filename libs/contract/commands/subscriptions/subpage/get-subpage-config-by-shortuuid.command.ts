import { z } from 'zod';

import { REST_API, SUBSCRIPTIONS_ROUTES } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetSubpageConfigByShortUuidCommand {
    export const url = REST_API.SUBSCRIPTIONS.SUBPAGE.GET_CONFIG;
    export const TSQ_url = url(':shortUuid');

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTIONS_ROUTES.SUBPAGE.GET_CONFIG(':shortUuid'),
        'get',
        'Get Subpage Config by Short UUID',
    );

    export const RequestSchema = z.object({
        shortUuid: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const RequestBodySchema = z.object({
        requestHeaders: z.record(z.string(), z.string()),
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            subpageConfigUuid: z.string().uuid().nullable(),
            webpageAllowed: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
