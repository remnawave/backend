import { z } from 'zod';
import { REST_API } from '../../api';
import { RESET_PERIODS } from '../../constants';
import { InboundsSchema, UsersSchema } from '../../models';

export namespace UpdateUserCommand {
    export const url = REST_API.USERS.UPDATE;

    export const RequestSchema = UsersSchema.pick({
        uuid: true,
    }).extend({
        status: UsersSchema.shape.status.optional(),
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
            .optional()
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
        enabledInbounds: z
            .array(
                InboundsSchema.pick({
                    uuid: true,
                }),
                {
                    invalid_type_error: 'Enabled inbounds must be an array',
                },
            )
            .optional(),
        expireAt: z.coerce
            .date({
                required_error: 'Expiration date is required',
                invalid_type_error: 'Invalid expiration date format',
            })
            .refine((date) => date > new Date(), {
                message: 'Expiration date cannot be in the past',
            })
            .optional(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: UsersSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}