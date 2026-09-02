import { z } from 'zod';

import { HOSTS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { HostResponseSchema } from './host.response';

export namespace CloneHostCommand {
    export const url = REST_API.HOSTS.ACTIONS.CLONE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        HOSTS_ROUTES.ACTIONS.CLONE,
        'post',
        'Clone host',
        { scope: 'clone', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        cloneFromUuid: z.uuid(),
    });

    export const ResponseSchema = HostResponseSchema;

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
