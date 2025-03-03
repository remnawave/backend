import { z } from 'zod';

import { NodesSchema } from '../../models';
import { REST_API } from '../../api';

export namespace EnableNodeCommand {
    export const url = REST_API.NODES.ENABLE;
    export const TSQ_url = url(':uuid');

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: NodesSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
