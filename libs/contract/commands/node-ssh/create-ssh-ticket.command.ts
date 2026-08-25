import { z } from 'zod';

import { NODE_SSH_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace CreateSshTicketCommand {
    export const url = REST_API.NODE_SSH.CREATE_TICKET;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODE_SSH_ROUTES.CREATE_TICKET(':uuid'),
        'post',
        'Create a single-use ticket for opening an SSH terminal session',
        { scope: 'node-ssh', kind: 'write' },
    );

    export const RequestParamSchema = z.object({
        uuid: z.uuid().describe('Node UUID'),
    });

    export const ResponseSchema = z.object({
        response: z.object({
            ticket: z.string(),
            path: z.string(),
            expiresInSeconds: z.number(),
        }),
    });

    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
