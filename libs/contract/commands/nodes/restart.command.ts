import { z } from 'zod';

import { REST_API } from '../../api';

export namespace RestartNodeCommand {
    export const url = REST_API.NODES.RESTART;
    export const TSQ_url = url(':uuid');

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            eventSent: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
