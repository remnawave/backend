import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AcmeEventSchema } from '../../../models';

export namespace GetAcmeCertificateEventsCommand {
    export const url = REST_API.ACME.CERTIFICATES.EVENTS;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CERTIFICATES.EVENTS(':uuid'),
        'get',
        'Get the issuance log of a certificate',
        { scope: 'get-certificate-events', kind: 'read' },
    );

    export const RequestParamSchema = z.object({
        uuid: z.uuid(),
    });

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            events: z.array(AcmeEventSchema),
        }),
    });

    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
