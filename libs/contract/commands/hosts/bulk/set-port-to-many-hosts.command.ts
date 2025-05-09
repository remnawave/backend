import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { HOSTS_ROUTES, REST_API } from '../../../api';
import { HostsSchema } from '../../../models';

export namespace SetPortToManyHostsCommand {
    export const url = REST_API.HOSTS.BULK.SET_PORT;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        HOSTS_ROUTES.BULK.SET_PORT,
        'post',
        'Set port to hosts by UUIDs',
    );

    export const RequestSchema = z.object({
        uuids: z.array(z.string().uuid()),
        port: z.number().int().min(1).max(65535),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.array(HostsSchema),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
