import { z } from 'zod';

import { REST_API, API_TOKENS_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace CreateApiTokenCommand {
    export const url = REST_API.API_TOKENS.CREATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        API_TOKENS_ROUTES.CREATE,
        'post',
        'Create a new API token',
        'This endpoint is forbidden to use via "API-key". It can be used only admin JWT-token.',
    );

    export const RequestSchema = z.object({
        tokenName: z.string(),
        tokenDescription: z.string().nullable(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            token: z.string(),
            uuid: z.string(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
