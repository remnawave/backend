import { z } from 'zod';
import { REST_API } from '../../api';

export namespace DeleteHostCommand {
    export const url = REST_API.HOSTS.DELETE;

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isDeleted: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}