import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { ExtendedUsersSchema } from '../../../models';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace GetUserByIdCommand {
    export const url = REST_API.USERS.GET_BY.ID;
    export const TSQ_url = url(':id');

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.GET_BY.ID(':id'),
        'get',
        'Get user by ID',
    );

    export const RequestSchema = z.object({
        id: z.coerce.bigint(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: ExtendedUsersSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
