import z from 'zod';

import { EVENTS, EVENTS_SCOPES, toZodEnum, CRUD_ACTIONS } from '../../constants';
import { HwidUserDeviceSchema } from '../hwid-user-device.schema';
import { ExtendedUsersSchema } from '../extended-users.schema';
import { NodesSchema } from '../nodes.schema';

export const RemnawaveWebhookUserEvents = z.object({
    scope: z.literal(EVENTS_SCOPES.USER),
    event: z.enum(toZodEnum(EVENTS.USER)),
    timestamp: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    data: ExtendedUsersSchema,
    meta: z
        .object({
            notConnectedAfterHours: z.number().int().nullable().optional(),
        })
        .nullable(),
});

export const RemnawaveWebhookUserHwidDevicesEvents = z.object({
    scope: z.literal(EVENTS_SCOPES.USER_HWID_DEVICES),
    event: z.enum(toZodEnum(EVENTS.USER_HWID_DEVICES)),
    timestamp: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    data: z.object({
        user: ExtendedUsersSchema,
        hwidUserDevice: HwidUserDeviceSchema,
    }),
});

export const RemnawaveWebhookNodeEvents = z.object({
    scope: z.literal(EVENTS_SCOPES.NODE),
    event: z.enum(toZodEnum(EVENTS.NODE)),
    timestamp: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    data: NodesSchema,
});

export const RemnawaveWebhookServiceEvents = z.object({
    scope: z.literal(EVENTS_SCOPES.SERVICE),
    event: z.enum(toZodEnum(EVENTS.SERVICE)),
    timestamp: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    data: z.object({
        loginAttempt: z
            .object({
                username: z.string(),
                ip: z.string(),
                userAgent: z.string(),
                description: z.string().optional(),
                password: z.string().optional(),
            })
            .optional(),
        panelVersion: z.string().optional(),
        subpageConfig: z
            .object({
                action: z.enum(toZodEnum(CRUD_ACTIONS)),
                uuid: z.string().uuid(),
            })

            .optional(),
    }),
});

export const RemnawaveWebhookErrorsEvents = z.object({
    scope: z.literal(EVENTS_SCOPES.ERRORS),
    event: z.enum(toZodEnum(EVENTS.ERRORS)),
    timestamp: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    data: z.object({
        description: z.string(),
    }),
});

export const RemnawaveWebhookCrmEvents = z.object({
    scope: z.literal(EVENTS_SCOPES.CRM),
    event: z.enum(toZodEnum(EVENTS.CRM)),
    timestamp: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    data: z.object({
        providerName: z.string(),
        nodeName: z.string(),
        nextBillingAt: z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
        loginUrl: z.string(),
    }),
});

export const RemnawaveWebhookEventSchema = z.discriminatedUnion('scope', [
    RemnawaveWebhookUserEvents,
    RemnawaveWebhookUserHwidDevicesEvents,
    RemnawaveWebhookNodeEvents,
    RemnawaveWebhookServiceEvents,
    RemnawaveWebhookErrorsEvents,
    RemnawaveWebhookCrmEvents,
]);

export type TRemnawaveWebhookEvent = z.infer<typeof RemnawaveWebhookEventSchema>;

export type TRemnawaveWebhookUserEvent = z.infer<typeof RemnawaveWebhookUserEvents>;
export type TRemnawaveWebhookNodeEvent = z.infer<typeof RemnawaveWebhookNodeEvents>;
export type TRemnawaveWebhookServiceEvent = z.infer<typeof RemnawaveWebhookServiceEvents>;
export type TRemnawaveWebhookErrorsEvent = z.infer<typeof RemnawaveWebhookErrorsEvents>;
export type TRemnawaveWebhookCrmEvent = z.infer<typeof RemnawaveWebhookCrmEvents>;
export type TRemnawaveWebhookUserHwidDevicesEvent = z.infer<
    typeof RemnawaveWebhookUserHwidDevicesEvents
>;
