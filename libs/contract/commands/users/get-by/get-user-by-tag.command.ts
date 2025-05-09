import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { ExtendedUsersSchema } from '../../../models';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace GetUserByTagCommand {
    export const url = REST_API.USERS.GET_BY.TAG;
    export const TSQ_url = url(':tag');

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.GET_BY.TAG(':tag'),
        'get',
        'Get users by tag',
    );

    export const RequestSchema = z.object({
        tag: z
            .string()
            .regex(/^[A-Z0-9_]+$/, 'Tag can only contain uppercase letters, numbers, underscores')
            .max(16, 'Tag must be less than 16 characters'),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.array(ExtendedUsersSchema),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
