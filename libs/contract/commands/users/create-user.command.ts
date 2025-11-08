import { z } from 'zod';

import { getEndpointDetails, RESET_PERIODS, USERS_STATUS } from '../../constants';
import { ExtendedUsersSchema, UsersSchema } from '../../models';
import { REST_API, USERS_ROUTES } from '../../api';

export namespace CreateUserCommand {
    export const url = REST_API.USERS.CREATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.CREATE,
        'post',
        'Create a new user',
    );

    export const RequestSchema = z.object({
        username: z
            .string({
                required_error: 'Username is required',
                invalid_type_error: 'Username must be a string',
            })
            .regex(
                /^[a-zA-Z0-9_-]+$/,
                'Username can only contain letters, numbers, underscores and dashes',
            )
            .max(36, 'Username must be less than 36 characters')
            .min(3, 'Username must be at least 3 characters')
            .describe(
                'Unique username for the user. Required. Must be 3-36 characters long and contain only letters, numbers, underscores and dashes.',
            ),
        status: UsersSchema.shape.status
            .optional()
            .default(USERS_STATUS.ACTIVE)
            .describe('Optional. User account status. Defaults to ACTIVE.'),
        shortUuid: z
            .string({
                invalid_type_error: 'Short UUID must be a string',
            })
            .optional()
            .describe('Optional. Short UUID identifier for the user.'),
        trojanPassword: z
            .string({
                invalid_type_error: 'Trojan password must be a string',
            })
            .min(8, 'Trojan password must be at least 8 characters')
            .max(32, 'Trojan password must be less than 32 characters')
            .optional()
            .describe('Optional. Password for Trojan protocol. Must be 8-32 characters.'),
        vlessUuid: z
            .string({
                invalid_type_error: 'Vless UUID must be a string',
            })
            .uuid('Invalid Vless UUID format')
            .optional()
            .describe('Optional. UUID for VLESS protocol. Must be a valid UUID format.'),
        ssPassword: z
            .string({
                invalid_type_error: 'SS password must be a string',
            })
            .min(8, 'SS password must be at least 8 characters')
            .max(32, 'SS password must be less than 32 characters')
            .optional()
            .describe('Optional. Password for Shadowsocks protocol. Must be 8-32 characters.'),
        trafficLimitBytes: z
            .number({
                invalid_type_error: 'Traffic limit must be a number',
            })
            .int('Traffic limit must be an integer')
            .min(0, 'Traffic limit must be greater than 0')
            .optional()
            .describe('Optional. Traffic limit in bytes. Set to 0 for unlimited traffic.'),
        trafficLimitStrategy: z.optional(
            UsersSchema.shape.trafficLimitStrategy
                .default(RESET_PERIODS.NO_RESET)
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
                }),
        ),
        expireAt: z
            .string({
                required_error: 'Expiration date is required',
                invalid_type_error: 'Invalid date format',
            })
            .datetime({ message: 'Invalid date format', offset: true, local: true })
            .transform((str) => new Date(str))
            .describe('Account expiration date. Required. Format: 2025-01-17T15:38:45.065Z'),
        createdAt: z
            .string({
                invalid_type_error: 'Invalid date format',
            })
            .datetime({ message: 'Invalid date format', offset: true, local: true })
            .transform((str) => new Date(str))
            .optional()
            .describe('Optional. Account creation date. Format: 2025-01-17T15:38:45.065Z'),
        lastTrafficResetAt: z
            .string({
                invalid_type_error: 'Invalid date format',
            })
            .datetime({ message: 'Invalid date format', offset: true, local: true })
            .transform((str) => new Date(str))
            .optional()
            .describe('Optional. Date of last traffic reset. Format: 2025-01-17T15:38:45.065Z'),
        description: z
            .string()
            .optional()
            .describe('Optional. Additional notes or description for the user account.'),
        tag: z
            .optional(
                z
                    .string()
                    .regex(
                        /^[A-Z0-9_]+$/,
                        'Tag can only contain uppercase letters, numbers, underscores',
                    )
                    .max(16, 'Tag must be less than 16 characters')
                    .nullable(),
            )
            .describe(
                'Optional. User tag for categorization. Max 16 characters, uppercase letters, numbers and underscores only.',
            ),

        telegramId: z
            .optional(z.number().int().nullable())
            .describe('Optional. Telegram user ID for notifications. Must be an integer.'),
        email: z
            .optional(z.string().email('Invalid email format').nullable())
            .describe('Optional. User email address. Must be a valid email format.'),

        hwidDeviceLimit: z.optional(
            z
                .number({ invalid_type_error: 'Device limit must be a number' })
                .int('Device limit must be an integer')
                .min(0, 'Device limit must be greater than 0')
                .describe(
                    'Optional. Maximum number of hardware devices allowed. Must be a positive integer.',
                ),
        ),
        activeInternalSquads: z
            .array(z.string().uuid(), {
                invalid_type_error: 'Enabled internal squads must be an array',
            })
            .optional()
            .describe('Optional. Array of UUIDs representing enabled internal squads.'),
        uuid: z.optional(
            z
                .string()
                .uuid()
                .describe(
                    'Optional. Pass UUID to create user with specific UUID, otherwise it will be generated automatically.',
                ),
        ),
        externalSquadUuid: z
            .optional(z.nullable(z.string().uuid()))
            .describe('Optional. External squad UUID.'),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: ExtendedUsersSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
