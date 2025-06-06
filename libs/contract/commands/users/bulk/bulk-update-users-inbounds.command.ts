import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace BulkUpdateUsersInboundsCommand {
    export const url = REST_API.USERS.BULK.UPDATE_INBOUNDS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.BULK.UPDATE_INBOUNDS,
        'post',
        'Bulk update users inbounds by UUIDs',
    );

    export const RequestSchema = z.object({
        uuids: z.array(z.string().uuid()),
        activeUserInbounds: z.array(z.string().uuid(), {
            invalid_type_error: 'Enabled inbounds must be an array of UUIDs',
        }),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            affectedRows: z.number(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
