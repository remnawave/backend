import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { ACME_CHALLENGE_TYPES, ACME_KEY_TYPES, getEndpointDetails } from '../../../constants';
import { AcmeCertificateSchema, AcmeDomainSchema } from '../../../models';
import { AcmeCertificateNodeBindingSchema } from './create-acme-certificate.command';

export namespace UpdateAcmeCertificateCommand {
    export const url = REST_API.ACME.CERTIFICATES.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CERTIFICATES.UPDATE,
        'patch',
        'Update ACME certificate',
        { scope: 'update-certificate', kind: 'write' },
    );

    /**
     * Changing domains, key type or the CA invalidates what is stored: the next
     * run re-issues from scratch. Changing only the bindings does not — the
     * stored certificate is simply delivered to a different set of nodes.
     */
    export const RequestBodySchema = z.object({
        uuid: z.uuid(),

        name: z.optional(
            z
                .string()
                .min(2, 'Name must be at least 2 characters')
                .max(40, 'Name must be less than 40 characters')
                .regex(
                    /^[A-Za-z0-9_\s-]+$/,
                    'Name can only contain letters, numbers, underscores, dashes and spaces',
                ),
        ),

        domains: z.optional(z.array(AcmeDomainSchema).min(1).max(100)),
        challengeType: z.optional(z.enum(ACME_CHALLENGE_TYPES)),
        keyType: z.optional(z.enum(ACME_KEY_TYPES)),
        renewBeforeDays: z.optional(z.number().int().min(1).max(85)),
        isEnabled: z.optional(z.boolean()),

        directoryUrl: z.optional(z.url()),
        email: z.optional(z.email()),
        eabKid: z.optional(z.string().min(1)),
        eabHmacKey: z.optional(z.string().min(1)),

        credentialUuid: z.optional(z.uuid()),

        nodes: z.optional(z.array(AcmeCertificateNodeBindingSchema)),
    });

    export const ResponseSchema = z.object({
        response: AcmeCertificateSchema,
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
