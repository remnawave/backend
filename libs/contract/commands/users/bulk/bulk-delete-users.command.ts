import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace BulkDeleteUsersCommand {
    export const url = REST_API.USERS.BULK.DELETE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.BULK.DELETE,
        'post',
        'Bulk delete users by UUIDs',
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
