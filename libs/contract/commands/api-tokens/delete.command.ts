import { z } from 'zod';

import { REST_API, API_TOKENS_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace DeleteApiTokenCommand {
    export const url = REST_API.API_TOKENS.DELETE;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        API_TOKENS_ROUTES.DELETE(':uuid'),
        'delete',
        'Delete an API token by UUID',
        'This endpoint is forbidden to use via "API-key". It can be used only admin JWT-token.',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.boolean(),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
