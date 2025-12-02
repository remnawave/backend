import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace BulkUpdateUsersSquadsCommand {
    export const url = REST_API.USERS.BULK.UPDATE_SQUADS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.BULK.UPDATE_SQUADS,
        'post',
        'Bulk update users internal squads by UUIDs',
    );

    export const RequestSchema = z.object({
        uuids: z
            .array(z.string().uuid())
            .min(1, 'Must be at least 1 user UUID')
            .max(500, 'Maximum 500 user UUIDs'),
        activeInternalSquads: z.array(z.string().uuid(), {
            invalid_type_error: 'Enabled internal squads must be an array of UUIDs',
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
