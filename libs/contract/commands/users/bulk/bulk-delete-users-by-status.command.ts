import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { REST_API, USERS_ROUTES } from '../../../api';
import { UsersSchema } from '../../../models';

export namespace BulkDeleteUsersByStatusCommand {
    export const url = REST_API.USERS.BULK.DELETE_BY_STATUS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.BULK.DELETE_BY_STATUS,
        'post',
        'Bulk delete users by status',
    );

    export const RequestSchema = z.object({
        status: UsersSchema.shape.status,
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            affectedRows: z.number(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
