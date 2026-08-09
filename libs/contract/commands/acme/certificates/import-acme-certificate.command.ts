import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AcmeCertificateSchema } from '../../../models';
import { AcmeCertificateNodeBindingSchema } from './create-acme-certificate.command';

/**
 * PEM material as it arrives from the caller.
 *
 * Both fields are plain text on purpose: a file upload in the UI is the file's
 * contents put into the same field, so the API stays a single JSON shape whether
 * the operator pasted the certificate or picked a file.
 */
export const AcmePemMaterialSchema = z.object({
    /**
     * The certificate, optionally followed by its chain. Extra certificates are
     * kept as they are: Xray serves the chain exactly as given.
     */
    fullchainPem: z
        .string()
        .min(1)
        .refine(
            (value) => value.includes('-----BEGIN CERTIFICATE-----'),
            'Expected a PEM certificate',
        ),
    /** The matching private key. It is checked against the certificate before anything is stored. */
    privateKeyPem: z
        .string()
        .min(1)
        .refine((value) => value.includes('-----BEGIN'), 'Expected a PEM private key'),
});

export namespace ImportAcmeCertificateCommand {
    export const url = REST_API.ACME.CERTIFICATES.IMPORT;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CERTIFICATES.IMPORT,
        'post',
        'Import an existing certificate',
        { scope: 'import-certificate', kind: 'write' },
        'Stores a certificate the panel did not issue and delivers it to nodes. Domains, validity and key type are read from the certificate itself.',
    );

    export const RequestBodySchema = AcmePemMaterialSchema.extend({
        isEnabled: z.optional(z.boolean()).default(true),
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(40, 'Name must be less than 40 characters')
            .regex(
                /^[A-Za-z0-9_\s-]+$/,
                'Name can only contain letters, numbers, underscores, dashes and spaces',
            ),
        nodes: z.optional(z.array(AcmeCertificateNodeBindingSchema)).default([]),
    });

    export const ResponseSchema = z.object({
        response: AcmeCertificateSchema,
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
