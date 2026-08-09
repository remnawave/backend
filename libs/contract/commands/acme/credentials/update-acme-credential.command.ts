import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { AcmeCredentialSchema } from '../../../models';

export namespace UpdateAcmeCredentialCommand {
    export const url = REST_API.ACME.CREDENTIALS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CREDENTIALS.UPDATE,
        'patch',
        'Update ACME credential',
        { scope: 'update-credential', kind: 'write' },
    );

    /**
     * Secrets are write-only: omitting them keeps whatever is stored. The
     * provider itself cannot be changed — the stored payload belongs to it; make
     * a new credential instead.
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

        /**
         * Provider configuration keyed by ACME_PROVIDER_REGISTRY field keys.
         * Only the keys present are touched; an empty string keeps the stored
         * value (that is what an untouched secret input submits as).
         */
        config: z.optional(z.record(z.string(), z.string())),
    });

    export const ResponseSchema = z.object({
        response: AcmeCredentialSchema,
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
