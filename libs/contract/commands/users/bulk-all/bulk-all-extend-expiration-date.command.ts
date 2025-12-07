import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace BulkAllExtendExpirationDateCommand {
    export const url = REST_API.USERS.BULK.ALL.EXTEND_EXPIRATION_DATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.BULK.ALL.EXTEND_EXPIRATION_DATE,
        'post',
        'Extend expiration date for all users by days',
    );

    export const RequestSchema = z.object({
        extendDays: z.number().int().min(1, 'Extend days must be greater than 0'),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            eventSent: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
