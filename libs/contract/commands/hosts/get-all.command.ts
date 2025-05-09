import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { HOSTS_ROUTES, REST_API } from '../../api';
import { HostsSchema } from '../../models';

export namespace GetAllHostsCommand {
    export const url = REST_API.HOSTS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(HOSTS_ROUTES.GET, 'get', 'Get all hosts');

    export const ResponseSchema = z.object({
        response: z.array(HostsSchema),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
