import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { ERRORS } from '@libs/contracts/constants';
import {
    RemnawaveWebhookCrmEvents,
    RemnawaveWebhookErrorsEvents,
    RemnawaveWebhookNodeEvents,
    RemnawaveWebhookServiceEvents,
    RemnawaveWebhookUserEvents,
    RemnawaveWebhookUserHwidDevicesEvents,
    RemnawaveWebhookTorrentBlockerEvents,
    RemnawaveUserUsageStreamMessageSchema,
    RemnawaveSubscriptionRequestStreamMessageSchema,
    RemnawaveNodeConnectionsStreamMessageSchema,
} from '@libs/contracts/models';

export class RemnawaveWebhookUserEventsDto extends createZodDto(RemnawaveWebhookUserEvents) {}
export class RemnawaveWebhookUserHwidDevicesEventsDto extends createZodDto(
    RemnawaveWebhookUserHwidDevicesEvents,
) {}
export class RemnawaveWebhookNodeEventsDto extends createZodDto(RemnawaveWebhookNodeEvents) {}
export class RemnawaveWebhookServiceEventsDto extends createZodDto(RemnawaveWebhookServiceEvents) {}
export class RemnawaveWebhookErrorsEventsDto extends createZodDto(RemnawaveWebhookErrorsEvents) {}
export class RemnawaveWebhookCrmEventsDto extends createZodDto(RemnawaveWebhookCrmEvents) {}
export class RemnawaveWebhookTorrentBlockerEventsDto extends createZodDto(
    RemnawaveWebhookTorrentBlockerEvents,
) {}

export class RemnawaveUserUsageStreamMessageDto extends createZodDto(
    RemnawaveUserUsageStreamMessageSchema,
) {}

export class RemnawaveSubscriptionRequestStreamMessageDto extends createZodDto(
    RemnawaveSubscriptionRequestStreamMessageSchema,
) {}

export class RemnawaveNodeConnectionsStreamMessageDto extends createZodDto(
    RemnawaveNodeConnectionsStreamMessageSchema,
) {}

const notFoundErrors = Object.values(ERRORS).filter(
    (error) => error.httpCode === 404 && !('withMessage' in error),
);
const badRequestErrors = Object.values(ERRORS).filter(
    (error) => error.httpCode === 400 && !('withMessage' in error),
);
const internalServerErrors = Object.values(ERRORS).filter(
    (error) => error.httpCode === 500 && !('withMessage' in error),
);

export class RemnawaveNotFoundErrorDto extends createZodDto(
    z.object({
        timestamp: z.iso
            .datetime({ local: true, offset: true })
            .describe('Time when the error occurred, in ISO 8601 format.'),
        path: z.string().describe('Path of the request that caused the error.'),
        message: z
            .enum(notFoundErrors.map((error) => error.message) as [string, ...string[]])
            .describe('Human-readable error message.'),
        errorCode: z
            .enum(notFoundErrors.map((error) => error.code) as [string, ...string[]])
            .describe(
                [
                    'Error code. Possible values:',
                    '',
                    ...notFoundErrors.map(({ code, message }) => `- \`${code}\` — ${message}`),
                ].join('\n'),
            ),
    }),
) {}

export class RemnawaveBadRequestErrorDto extends createZodDto(
    z.object({
        timestamp: z.iso
            .datetime({ local: true, offset: true })
            .describe('Time when the error occurred, in ISO 8601 format.'),
        path: z.string().describe('Path of the request that caused the error.'),
        message: z
            .enum(badRequestErrors.map((error) => error.message) as [string, ...string[]])
            .describe('Human-readable error message.'),
        errorCode: z
            .enum(badRequestErrors.map((error) => error.code) as [string, ...string[]])
            .describe(
                [
                    'Error code. Possible values:',
                    '',
                    ...badRequestErrors.map(({ code, message }) => `- \`${code}\` — ${message}`),
                ].join('\n'),
            ),
    }),
) {}

export class RemnawaveValidationErrorDto extends createZodDto(
    z.object({
        message: z.string().describe('Human-readable error message.'),
        statusCode: z.number().describe('HTTP status code.'),
        errors: z
            .array(
                z.object({
                    validation: z.string().describe('Validation type, e.g. `uuid`.'),
                    code: z.string().describe('Zod issue code, e.g. `invalid_string`.'),
                    message: z.string().describe('Human-readable issue message.'),
                    path: z.array(z.string()).describe('Path to the field that failed validation.'),
                }),
            )
            .describe('List of validation issues.'),
    }),
) {}

export class RemnawaveInternalServerErrorDto extends createZodDto(
    z.object({
        timestamp: z.iso
            .datetime({ local: true, offset: true })
            .describe('Time when the error occurred, in ISO 8601 format.'),
        path: z.string().describe('Path of the request that caused the error.'),
        message: z
            .enum(internalServerErrors.map((error) => error.message) as [string, ...string[]])
            .describe('Human-readable error message.'),
        errorCode: z
            .enum(internalServerErrors.map((error) => error.code) as [string, ...string[]])
            .describe(
                [
                    'Error code. Possible values:',
                    '',
                    ...internalServerErrors.map(
                        ({ code, message }) => `- \`${code}\` — ${message}`,
                    ),
                ].join('\n'),
            ),
    }),
) {}
