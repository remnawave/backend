import { z } from 'zod';

import { UsersSchema } from '../../models/users.schema';
import { LastConnectedNodeSchema } from '../../models';
import { REST_API } from '../../api';

export namespace GetUserByUuidCommand {
    export const url = REST_API.USERS.GET_BY_UUID;
    export const TSQ_url = url(':uuid');

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: UsersSchema.extend({
            subscriptionUrl: z.string(),
            lastConnectedNode: LastConnectedNodeSchema,
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
