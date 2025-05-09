import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace BulkResetTrafficUsersCommand {
    export const url = REST_API.USERS.BULK.RESET_TRAFFIC;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.BULK.RESET_TRAFFIC,
        'post',
        'Bulk reset traffic users by UUIDs',
    );

    export const RequestSchema = z.object({
        uuids: z.array(z.string().uuid()),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            affectedRows: z.number(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
