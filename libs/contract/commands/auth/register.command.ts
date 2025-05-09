import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { AUTH_ROUTES, REST_API } from '../../api';

export namespace RegisterCommand {
    export const url = REST_API.AUTH.REGISTER;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        AUTH_ROUTES.REGISTER,
        'post',
        'Register as superadmin',
    );

    export const RequestSchema = z.object({
        username: z.string(),
        password: z
            .string()
            .min(24, 'Password must contain at least 24 characters')
            .regex(
                /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{24,}$/,
                'Password must contain uppercase and lowercase letters and numbers, and be at least 24 characters long.',
            ),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            accessToken: z.string(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
