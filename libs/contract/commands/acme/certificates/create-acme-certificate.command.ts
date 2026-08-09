import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import {
    ACME_CHALLENGE_TYPE,
    ACME_CHALLENGE_TYPES,
    ACME_DIRECTORY,
    ACME_KEY_TYPE,
    ACME_KEY_TYPES,
    getEndpointDetails,
} from '../../../constants';
import { AcmeCertificateSchema, AcmeDomainSchema } from '../../../models';

/** Which nodes and inbounds a certificate is delivered to. */
export const AcmeCertificateNodeBindingSchema = z.object({
    nodeUuid: z.uuid(),
    /**
     * Empty means every TLS inbound the node runs. Naming tags is how one node
     * ends up with different certificates on different inbounds.
     */
    inboundTags: z.array(z.string()).default([]),
});

export namespace CreateAcmeCertificateCommand {
    export const url = REST_API.ACME.CERTIFICATES.CREATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CERTIFICATES.CREATE,
        'post',
        'Create ACME certificate',
        { scope: 'create-certificate', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(40, 'Name must be less than 40 characters')
            .regex(
                /^[A-Za-z0-9_\s-]+$/,
                'Name can only contain letters, numbers, underscores, dashes and spaces',
            ),

        domains: z.array(AcmeDomainSchema).min(1).max(100),

        challengeType: z.optional(z.enum(ACME_CHALLENGE_TYPES)).default(ACME_CHALLENGE_TYPE.DNS_01),
        keyType: z.optional(z.enum(ACME_KEY_TYPES)).default(ACME_KEY_TYPE.ECDSA_P256),

        /**
         * Renewal window. Kept away from zero so a broken solver has several
         * attempts before the certificate actually expires.
         */
        renewBeforeDays: z.optional(z.number().int().min(1).max(85)).default(30),
        isEnabled: z.optional(z.boolean()).default(true),

        /** Defaults to staging: the first issuance of a new name should not spend production rate limit. */
        directoryUrl: z.optional(z.url()).default(ACME_DIRECTORY.LETSENCRYPT_STAGING),
        email: z.email(),

        eabKid: z.optional(z.string().min(1)),
        eabHmacKey: z.optional(z.string().min(1)),

        credentialUuid: z.uuid(),

        nodes: z.optional(z.array(AcmeCertificateNodeBindingSchema)).default([]),
    });

    export const ResponseSchema = z.object({
        response: AcmeCertificateSchema,
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
