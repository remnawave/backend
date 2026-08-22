import { z } from 'zod';

import { HOSTS_ROUTES, REST_API } from '../../api';
import {
    getEndpointDetails,
    SECURITY_LAYERS,
    ALPN,
    SUBSCRIPTION_TEMPLATE_TYPE,
    MIHOMO_IP_VERSION,
} from '../../constants';
import { HostInternalSquadsSchema, HostMapperSchema } from '../../models';
import { HostResponseSchema } from './host.response';

export namespace CreateHostCommand {
    export const url = REST_API.HOSTS.CREATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        HOSTS_ROUTES.CREATE,
        'post',
        'Create a new host',
        { scope: 'create', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        inbound: z.object({
            configProfileUuid: z.uuid(),
            configProfileInboundUuid: z.uuid(),
        }),
        remark: z.string().min(1).max(100),

        address: z.string(),
        port: z.int(),
        path: z.string().nullish(),
        sni: z.string().nullish(),
        host: z.string().nullish(),
        alpn: z.enum(ALPN).nullish(),
        fingerprint: z.string().nullish(),
        isDisabled: z.optional(z.boolean().default(false)),
        securityLayer: z.optional(z.enum(SECURITY_LAYERS).default(SECURITY_LAYERS.DEFAULT)),
        xhttpExtraParams: z.unknown().nullish(),
        muxParams: z.unknown().nullish(),
        sockoptParams: z.unknown().nullish(),
        finalMask: z.unknown().nullish(),
        serverDescription: z.string().max(30).nullish(),

        tags: z.optional(
            z
                .array(
                    z
                        .string()
                        .regex(
                            /^[A-Z0-9_:]+$/,
                            'Tag can only contain uppercase letters, numbers, underscores and colons',
                        )
                        .max(36, 'Each tag must be less than 36 characters'),
                )
                .max(10, 'Maximum 10 tags'),
        ),
        isHidden: z.optional(z.boolean().default(false)),
        overrideSniFromAddress: z.optional(z.boolean().default(false)),
        keepSniBlank: z.optional(z.boolean().default(false)),
        pinnedPeerCertSha256: z.string().nullish(),
        verifyPeerCertByName: z.string().nullish(),
        vlessRouteId: z.int().min(0).max(65535).nullish(),
        shuffleHost: z.optional(z.boolean().default(false)),
        mihomoX25519: z.optional(z.boolean().default(false)),
        mihomoIpVersion: z.enum(MIHOMO_IP_VERSION).nullish(),
        nodes: z.optional(z.array(z.uuid())),
        xrayJsonTemplateUuid: z.uuid().nullish(),
        excludeFromSubscriptionTypes: z
            .optional(z.array(z.enum(SUBSCRIPTION_TEMPLATE_TYPE)))
            .describe('Optional. Subscription types from which the host will be excluded from.'),
        mapper: HostMapperSchema.optional(),
        internalSquads: HostInternalSquadsSchema.optional(),
    });

    export const ResponseSchema = HostResponseSchema;

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
