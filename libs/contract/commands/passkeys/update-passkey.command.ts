import { z } from 'zod';

import { PASSKEYS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace UpdatePasskeyCommand {
    export const url = REST_API.PASSKEYS.UPDATE_PASSKEY;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        PASSKEYS_ROUTES.UPDATE_PASSKEY,
        'patch',
        'Update passkey',
    );

    export const RequestSchema = z.object({
        id: z.string(),
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(30, 'Name must be less than 30 characters')
            .regex(
                /^[A-Za-z0-9_\s-]+$/,
                'Name can only contain letters, numbers, underscores, dashes and spaces',
            ),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            passkeys: z.array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    createdAt: z
                        .string()
                        .datetime({ message: 'Invalid date format', offset: true, local: true })
                        .transform((str) => new Date(str))
                        .describe('Created date. Format: 2025-01-17T15:38:45.065Z'),
                    lastUsedAt: z
                        .string()
                        .datetime({ message: 'Invalid date format', offset: true, local: true })
                        .transform((str) => new Date(str))
                        .describe('Last used date. Format: 2025-01-17T15:38:45.065Z'),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
