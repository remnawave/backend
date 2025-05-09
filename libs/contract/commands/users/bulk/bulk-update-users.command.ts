import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { REST_API, USERS_ROUTES } from '../../../api';
import { RESET_PERIODS } from '../../../constants';
import { UsersSchema } from '../../../models';

export namespace BulkUpdateUsersCommand {
    export const url = REST_API.USERS.BULK.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.BULK.UPDATE,
        'post',
        'Bulk update users by UUIDs',
    );

    export const RequestSchema = z.object({
        uuids: z.array(z.string().uuid()),
        fields: z.object({
            status: UsersSchema.shape.status.optional(),
            trafficLimitBytes: z.optional(
                z
                    .number({
                        invalid_type_error: 'Traffic limit must be a number',
                    })
                    .int('Traffic limit must be an integer')
                    .min(0, 'Traffic limit must be greater than 0')
                    .describe('Traffic limit in bytes. 0 - unlimited'),
            ),
            trafficLimitStrategy: z.optional(
                z
                    .nativeEnum(RESET_PERIODS, {
                        description: 'Available reset periods',
                    })
                    .describe('Traffic limit reset strategy'),
            ),
            expireAt: z.optional(
                z
                    .string()
                    .datetime({ local: true, offset: true, message: 'Invalid date format' })
                    .transform((str) => new Date(str))
                    .refine((date) => date > new Date(), {
                        message: 'Expiration date cannot be in the past',
                    })
                    .describe('Expiration date: 2025-01-17T15:38:45.065Z'),
            ),
            description: z.optional(z.string().nullable()),
            telegramId: z.optional(z.number().int().nullable()),
            email: z.optional(z.string().email('Invalid email format').nullable()),
            tag: z.optional(
                z
                    .string()
                    .regex(
                        /^[A-Z0-9_]+$/,
                        'Tag can only contain uppercase letters, numbers, underscores',
                    )
                    .max(16, 'Tag must be less than 16 characters')
                    .nullable(),
            ),
        }),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            affectedRows: z.number(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
