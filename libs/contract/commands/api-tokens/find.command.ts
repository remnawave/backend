import { z } from 'zod';

import { ApiTokensSchema } from '../../models/api-tokens.schema';
import { REST_API, API_TOKENS_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace FindAllApiTokensCommand {
    export const url = REST_API.API_TOKENS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        API_TOKENS_ROUTES.GET,
        'get',
        'Get all API tokens',
        'This endpoint is forbidden to use via "API-key". It can be used only admin JWT-token.',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            apiKeys: z.array(ApiTokensSchema),
            docs: z.object({
                isDocsEnabled: z.boolean(),
                scalarPath: z.string().nullable(),
                swaggerPath: z.string().nullable(),
            }),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
