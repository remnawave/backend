import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AcmeCertificateSchema } from '../../../models';

export namespace GetAcmeCertificatesCommand {
    export const url = REST_API.ACME.CERTIFICATES.GET_ALL;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CERTIFICATES.GET_ALL,
        'get',
        'Get all ACME certificates',
        { scope: 'list-certificates', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            certificates: z.array(AcmeCertificateSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
