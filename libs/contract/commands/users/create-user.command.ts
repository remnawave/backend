import { z } from 'zod';

import { REST_API, USERS_ROUTES } from '../../api';
import { getEndpointDetails, RESET_PERIODS, USERS_STATUS } from '../../constants';
import { UserResponseSchema } from './user.response';

export namespace CreateUserCommand {
    export const url = REST_API.USERS.CREATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.CREATE,
        'post',
        'Create a new user',
        { scope: 'create', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        username: z
            .string()
            .regex(
                /^[a-zA-Z0-9_-]+$/,
                'Username can only contain letters, numbers, underscores and dashes',
            )
            .max(36, 'Username must be less than 36 characters')
            .min(3, 'Username must be at least 3 characters')
            .describe(
                'Unique username for the user. Required. Must be 3-36 characters long and contain only letters, numbers, underscores and dashes.',
            ),
        status: z
            .enum(USERS_STATUS)
            .default(USERS_STATUS.ACTIVE)
            .optional()
            .describe('Optional. User account status. Defaults to ACTIVE.'),
        shortUuid: z.string().optional().describe('Optional. Short UUID identifier for the user.'),
        trojanPassword: z
            .string()
            .min(8, 'Trojan password must be at least 8 characters')
            .max(32, 'Trojan password must be less than 32 characters')
            .optional()
            .describe('Optional. Password for Trojan protocol. Must be 8-32 characters.'),
        vlessUuid: z
            .guid('Invalid Vless UUID format')
            .optional()
            .describe('Optional. UUID for VLESS protocol. Must be a valid UUID format.'),
        ssPassword: z
            .string()
            .min(8, 'SS password must be at least 8 characters')
            .max(32, 'SS password must be less than 32 characters')
            .optional()
            .describe('Optional. Password for Shadowsocks protocol. Must be 8-32 characters.'),
        trafficLimitBytes: z
            .number()
            .min(0, 'Traffic limit must be greater than 0')
            .optional()
            .describe('Optional. Traffic limit in bytes. Set to 0 for unlimited traffic.'),
        trafficLimitStrategy: z.optional(
            z
                .enum(RESET_PERIODS)
                .default(RESET_PERIODS.NO_RESET)
                .describe('Available reset periods'),
        ),
        expireAt: z.iso
            .datetime({ offset: true, local: true })
            .transform((str) => new Date(str))
            .describe('Account expiration date. Required. Format: 2025-01-17T15:38:45.065Z'),
        createdAt: z.iso
            .datetime({ offset: true, local: true })
            .transform((str) => new Date(str))
            .optional()
            .describe('Optional. Account creation date. Format: 2025-01-17T15:38:45.065Z'),
        lastTrafficResetAt: z.iso
            .datetime({ offset: true, local: true })
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
            .number()
            .nullish()
            .describe('Optional. Telegram user ID for notifications. Must be an integer.'),
        email: z
            .email()
            .nullish()
            .describe('Optional. User email address. Must be a valid email format.'),

        hwidDeviceLimit: z.optional(
            z
                .int()
                .min(0)
                .describe(
                    'Optional. Maximum number of hardware devices allowed. Must be a positive integer.',
                ),
        ),
        activeInternalSquads: z
            .array(z.uuid())
            .optional()
            .describe('Optional. Array of UUIDs representing enabled internal squads.'),
        externalSquadUuid: z
            .optional(z.nullable(z.uuid()))
            .describe('Optional. External squad UUID.'),
    });

    export const ResponseSchema = UserResponseSchema;

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
