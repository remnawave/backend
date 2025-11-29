import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace BulkExtendExpirationDateCommand {
    export const url = REST_API.USERS.BULK.EXTEND_EXPIRATION_DATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.BULK.EXTEND_EXPIRATION_DATE,
        'post',
        'Extend expiration date for specified users by days',
    );

    export const RequestSchema = z.object({
        uuids: z
            .array(z.string().uuid())
            .min(1, 'Must be at least 1 user UUID')
            .max(500, 'Maximum 500 user UUIDs'),

        extendDays: z
            .number()
            .int()
            .min(1, 'Extend days must be greater than 0')
            .max(9999, 'Maximum 9999 days'),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            affectedRows: z.number(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
