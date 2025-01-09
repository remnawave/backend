import { z } from 'zod';

import { UsersSchema } from '../../models/users.schema';
import { REST_API } from '../../api';

export namespace ResetUserTrafficCommand {
    export const url = REST_API.USERS.RESET_USER_TRAFFIC;
    export const TSQ_url = url(':uuid');

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: UsersSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}