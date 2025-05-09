import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { ExtendedUsersSchema } from '../../../models';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace GetUserByEmailCommand {
    export const url = REST_API.USERS.GET_BY.EMAIL;
    export const TSQ_url = url(':email');

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.GET_BY.EMAIL(':email'),
        'get',
        'Get users by email',
    );

    export const RequestSchema = z.object({
        email: z.string().email(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.array(ExtendedUsersSchema),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
