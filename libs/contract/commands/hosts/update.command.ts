import { z } from 'zod';

import { getEndpointDetails, FINGERPRINTS, SECURITY_LAYERS, ALPN } from '../../constants';
import { HOSTS_ROUTES, REST_API } from '../../api';
import { HostsSchema } from '../../models';

export namespace UpdateHostCommand {
    export const url = REST_API.HOSTS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        HOSTS_ROUTES.UPDATE,
        'patch',
        'Update a host',
    );

    export const RequestSchema = HostsSchema.pick({
        uuid: true,
    }).extend({
        inbound: z
            .object({
                configProfileUuid: z.string().uuid(),
                configProfileInboundUuid: z.string().uuid(),
            })
            .optional(),
        remark: z
            .string({
                invalid_type_error: 'Remark must be a string',
            })
            .max(40, {
                message: 'Remark must be less than 40 characters',
            })
            .optional(),
        address: z
            .string({
                invalid_type_error: 'Address must be a string',
            })
            .optional(),
        port: z
            .number({
                invalid_type_error: 'Port must be an integer',
            })
            .int()
            .optional(),
        path: z.optional(z.string()),
        sni: z.optional(z.string()),
        host: z.optional(z.string()),
        alpn: z.optional(z.nativeEnum(ALPN).nullable()),
        fingerprint: z.optional(z.nativeEnum(FINGERPRINTS).nullable()),
        isDisabled: z.optional(z.boolean()),
        securityLayer: z.optional(z.nativeEnum(SECURITY_LAYERS)),
        xHttpExtraParams: z.optional(z.nullable(z.unknown())),
        muxParams: z.optional(z.nullable(z.unknown())),
        sockoptParams: z.optional(z.nullable(z.unknown())),
        serverDescription: z.optional(
            z
                .string()
                .max(30, {
                    message: 'Server description must be less than 30 characters',
                })
                .nullable(),
        ),
        tag: z
            .optional(
                z
                    .string()
                    .regex(
                        /^[A-Z0-9_:]+$/,
                        'Tag can only contain uppercase letters, numbers, underscores and colons',
                    )
                    .max(32, 'Tag must be less than 32 characters')
                    .nullable(),
            )
            .describe(
                'Optional. Host tag for categorization. Max 32 characters, uppercase letters, numbers, underscores and colons are allowed.',
            ),
        isHidden: z.optional(z.boolean()),
        overrideSniFromAddress: z.optional(z.boolean()),
        vlessRouteId: z.optional(z.number().int().min(0).max(65535).nullable()),
        allowInsecure: z.optional(z.boolean()),
        shuffleHost: z.optional(z.boolean()),
        mihomoX25519: z.optional(z.boolean()),
    });
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: HostsSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
