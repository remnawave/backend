import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { HOSTS_ROUTES, REST_API } from '../../../api';
import { HostsSchema } from '../../../models';

export namespace BulkDeleteHostsCommand {
    export const url = REST_API.HOSTS.BULK.DELETE_HOSTS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        HOSTS_ROUTES.BULK.DELETE_HOSTS,
        'post',
        'Delete hosts by UUIDs',
    );

    export const RequestSchema = z.object({
        uuids: z.array(z.string().uuid()),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.array(HostsSchema),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
