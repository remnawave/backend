import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AcmeCertificateSchema } from '../../../models';

export namespace GetAcmeCertificateCommand {
    export const url = REST_API.ACME.CERTIFICATES.GET;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CERTIFICATES.GET(':uuid'),
        'get',
        'Get ACME certificate by uuid',
        { scope: 'get-certificate', kind: 'read' },
    );

    export const RequestParamSchema = z.object({
        uuid: z.uuid(),
    });

    export const ResponseSchema = z.object({
        response: AcmeCertificateSchema,
    });

    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
