import { z } from 'zod';

import { ExtendedUsersSchema } from '../../models';
import { REST_API } from '../../api';

export namespace RevokeUserSubscriptionCommand {
    export const url = REST_API.USERS.REVOKE_SUBSCRIPTION;
    export const TSQ_url = url(':uuid');

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: ExtendedUsersSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
