import { z } from 'zod';

import { getEndpointDetails, RESET_PERIODS, USERS_STATUS } from '../../constants';
import { ExtendedUsersSchema, UsersSchema } from '../../models';
import { REST_API, USERS_ROUTES } from '../../api';

export namespace UpdateUserCommand {
    export const url = REST_API.USERS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.UPDATE,
        'patch',
        'Update a user by UUID or username',
    );

    export const RequestSchema = z
        .object({
            username: z.optional(z.string().describe('Username of the user')),
            uuid: z.optional(
                z
                    .string()
                    .uuid()
                    .describe(
                        'UUID of the user. UUID has higher priority than username, so if both are provided, username will be ignored.',
                    ),
            ),
            status: z
                .enum([USERS_STATUS.ACTIVE, USERS_STATUS.DISABLED], {
                    errorMap: () => ({
                        message:
                            "You can't change status to LIMITED or EXPIRED. These statuses handled by Remnawave.",
                    }),
                })

                .optional(),
            trafficLimitBytes: z
                .number({
                    invalid_type_error: 'Traffic limit must be a number',
                })
                .int('Traffic limit must be an integer')
                .min(0, 'Traffic limit must be greater than 0')
                .describe('Traffic limit in bytes. 0 - unlimited')
                .optional(),
            trafficLimitStrategy: UsersSchema.shape.trafficLimitStrategy
                .describe('Traffic limit reset strategy')
                .superRefine((val, ctx) => {
                    if (val && !Object.values(RESET_PERIODS).includes(val)) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.invalid_enum_value,
                            message: 'Invalid traffic limit strategy',
                            path: ['trafficLimitStrategy'],
                            received: val,
                            options: Object.values(RESET_PERIODS),
                        });
                    }
                })
                .optional(),
            expireAt: z
                .string()
                .datetime({ local: true, offset: true, message: 'Invalid date format' })
                .transform((str) => new Date(str))
                .refine((date) => date > new Date(), {
                    message: 'Expiration date cannot be in the past',
                })
                .describe('Expiration date: 2025-01-17T15:38:45.065Z')
                .optional(),
            description: z.optional(z.string().nullable()),
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
            telegramId: z.optional(z.number().int().nullable()),
            email: z.optional(z.string().email('Invalid email format').nullable()),
            hwidDeviceLimit: z.optional(
                z.number().int().min(0, 'Device limit must be non-negative').nullable(),
            ),
            activeInternalSquads: z
                .array(z.string().uuid(), {
                    invalid_type_error: 'Enabled internal squads must be an array of UUIDs',
                })
                .optional(),
            externalSquadUuid: z
                .optional(z.nullable(z.string().uuid()))
                .describe('Optional. External squad UUID.'),
        })
        .refine((data) => data.uuid || data.username, {
            message: 'Either uuid or username must be provided',
        });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: ExtendedUsersSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
