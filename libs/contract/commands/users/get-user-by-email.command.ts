import { z } from 'zod';

import { UsersSchema } from '../../models/users.schema';
import { LastConnectedNodeSchema } from '../../models';
import { REST_API } from '../../api';

export namespace GetUserByEmailCommand {
    export const url = REST_API.USERS.GET_BY_EMAIL;
    export const TSQ_url = url(':email');

    export const RequestSchema = z.object({
        email: z.string().email(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.array(
            UsersSchema.extend({
                subscriptionUrl: z.string(),
                lastConnectedNode: LastConnectedNodeSchema,
            }),
        ),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
