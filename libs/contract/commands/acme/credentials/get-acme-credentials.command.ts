import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AcmeCredentialSchema } from '../../../models';

export namespace GetAcmeCredentialsCommand {
    export const url = REST_API.ACME.CREDENTIALS.GET_ALL;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CREDENTIALS.GET_ALL,
        'get',
        'Get all ACME credentials',
        { scope: 'list-credentials', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            credentials: z.array(AcmeCredentialSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
