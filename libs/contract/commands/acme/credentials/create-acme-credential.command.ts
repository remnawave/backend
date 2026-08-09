import { z } from 'zod';

import { ACME_ROUTES, REST_API } from '../../../api';
import { ACME_PROVIDER_REGISTRY, ACME_PROVIDERS, getEndpointDetails } from '../../../constants';
import { AcmeCredentialSchema } from '../../../models';

export namespace CreateAcmeCredentialCommand {
    export const url = REST_API.ACME.CREDENTIALS.CREATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        ACME_ROUTES.CREDENTIALS.CREATE,
        'post',
        'Create ACME credential',
        { scope: 'create-credential', kind: 'write' },
    );

    export const RequestBodySchema = z
        .object({
            name: z
                .string()
                .min(2, 'Name must be at least 2 characters')
                .max(40, 'Name must be less than 40 characters')
                .regex(
                    /^[A-Za-z0-9_\s-]+$/,
                    'Name can only contain letters, numbers, underscores, dashes and spaces',
                ),
            provider: z.enum(ACME_PROVIDERS),

            /**
             * Provider configuration keyed by the field keys from
             * ACME_PROVIDER_REGISTRY. Secret fields are write-only.
             */
            config: z.optional(z.record(z.string(), z.string())),
        })
        .superRefine((data, ctx) => {
            const info = ACME_PROVIDER_REGISTRY.find((entry) => entry.provider === data.provider);

            for (const field of info?.fields ?? []) {
                if (field.required && !data.config?.[field.key]) {
                    ctx.addIssue({
                        code: 'custom',
                        path: ['config', field.key],
                        message: `${field.key} is required for ${data.provider} credentials`,
                    });
                }
            }
        });

    export const ResponseSchema = z.object({
        response: AcmeCredentialSchema,
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
