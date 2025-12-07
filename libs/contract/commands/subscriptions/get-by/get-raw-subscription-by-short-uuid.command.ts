import { z } from 'zod';

import { REST_API, SUBSCRIPTIONS_ROUTES } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { ExtendedUsersSchema } from '../../../models';

export namespace GetRawSubscriptionByShortUuidCommand {
    export const url = REST_API.SUBSCRIPTIONS.GET_BY.SHORT_UUID_RAW;
    export const TSQ_url = url(':shortUuid');

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTIONS_ROUTES.GET_BY.SHORT_UUID_RAW(':shortUuid'),
        'get',
        'Get Raw Subscription by Short UUID',
    );

    export const RequestSchema = z.object({
        shortUuid: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const RequestQuerySchema = z.object({
        withDisabledHosts: z
            .string()
            .transform((str) => str === 'true')
            .optional()
            .default('false'),
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            user: ExtendedUsersSchema,
            convertedUserInfo: z.object({
                daysLeft: z.number(),
                trafficLimit: z.string(),
                trafficUsed: z.string(),
                lifetimeTrafficUsed: z.string(),
                isHwidLimited: z.boolean(),
            }),
            headers: z.record(z.string(), z.string().optional()),
            rawHosts: z.array(
                z.object({
                    address: z.optional(z.nullable(z.string())),
                    alpn: z.optional(z.nullable(z.string())),
                    fingerprint: z.optional(z.nullable(z.string())),
                    host: z.optional(z.nullable(z.string())),
                    network: z.optional(z.nullable(z.string())),
                    password: z.object({
                        ssPassword: z.string(),
                        trojanPassword: z.string(),
                        vlessPassword: z.string(),
                    }),
                    path: z.optional(z.nullable(z.string())),
                    publicKey: z.optional(z.nullable(z.string())),
                    port: z.optional(z.nullable(z.number())),
                    protocol: z.optional(z.nullable(z.string())),
                    remark: z.optional(z.nullable(z.string())),
                    shortId: z.optional(z.nullable(z.string())),
                    sni: z.optional(z.nullable(z.string())),
                    spiderX: z.optional(z.nullable(z.string())),
                    tls: z.optional(z.nullable(z.string())),
                    rawSettings: z.optional(
                        z.nullable(
                            z.object({
                                headerType: z.optional(z.nullable(z.string())),
                                request: z.optional(z.nullable(z.object({}))),
                            }),
                        ),
                    ),
                    additionalParams: z.optional(
                        z.nullable(
                            z.object({
                                mode: z.optional(z.nullable(z.string())),
                                heartbeatPeriod: z.optional(z.nullable(z.number())),
                            }),
                        ),
                    ),
                    xHttpExtraParams: z.optional(z.nullable(z.object({}))),
                    muxParams: z.optional(z.nullable(z.object({}))),
                    sockoptParams: z.optional(z.nullable(z.object({}))),
                    serverDescription: z.optional(z.nullable(z.string())),
                    flow: z.optional(z.nullable(z.string())),

                    allowInsecure: z.optional(z.nullable(z.boolean())),
                    shuffleHost: z.optional(z.nullable(z.boolean())),
                    mihomoX25519: z.optional(z.nullable(z.boolean())),
                    mldsa65Verify: z.optional(z.nullable(z.string())),
                    encryption: z.optional(z.nullable(z.string())),
                    protocolOptions: z.optional(
                        z.nullable(
                            z.object({
                                ss: z.optional(
                                    z.nullable(
                                        z.object({
                                            method: z.optional(z.nullable(z.string())),
                                        }),
                                    ),
                                ),
                            }),
                        ),
                    ),
                    dbData: z.optional(
                        z.object({
                            rawInbound: z.nullable(z.object({})),
                            inboundTag: z.string(),
                            uuid: z.string(),
                            configProfileUuid: z.nullable(z.string()),
                            configProfileInboundUuid: z.nullable(z.string()),
                            isDisabled: z.boolean(),
                            viewPosition: z.number(),
                            remark: z.string(),
                            isHidden: z.boolean(),
                            tag: z.nullable(z.string()),
                            vlessRouteId: z.number().int().nullable(),
                        }),
                    ),
                    xrayJsonTemplate: z.optional(z.nullable(z.object({}))),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
