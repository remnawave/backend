import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace BulkAllResetTrafficUsersCommand {
    export const url = REST_API.USERS.BULK.ALL.RESET_TRAFFIC;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.BULK.ALL.RESET_TRAFFIC,
        'post',
        'Reset user used traffic for all users',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            eventSent: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
