import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AcmeCertificateSchema } from '../../../models';
import { AcmePemMaterialSchema } from './import-acme-certificate.command';

export namespace ReimportAcmeCertificateCommand {
    export const url = REST_API.ACME.CERTIFICATES.REIMPORT;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CERTIFICATES.REIMPORT(':uuid'),
        'post',
        'Replace the material of an imported certificate',
        { scope: 'replace-certificate-material', kind: 'write' },
        'This is how an imported certificate is renewed: whoever issued it renews it, and the new PEM replaces the old one. Bound nodes are restarted.',
    );

    export const RequestParamSchema = z.object({
        uuid: z.uuid(),
    });

    export const RequestBodySchema = AcmePemMaterialSchema;

    export const ResponseSchema = z.object({
        response: AcmeCertificateSchema,
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
