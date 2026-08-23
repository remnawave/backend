import { z } from 'zod';

import { HOSTS_ROUTES, REST_API } from '../../api';
import {
    getEndpointDetails,
    SECURITY_LAYERS,
    ALPN,
    SUBSCRIPTION_TEMPLATE_TYPE,
    MIHOMO_IP_VERSION,
} from '../../constants';
import { HostInternalSquadsSchema, HostMapperSchema, HostsSchema } from '../../models';
import { HostResponseSchema } from './host.response';

export namespace UpdateHostCommand {
    export const url = REST_API.HOSTS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        HOSTS_ROUTES.UPDATE,
        'patch',
        'Update a host',
        { scope: 'update', kind: 'write' },
    );

    export const RequestBodySchema = HostsSchema.pick({
        uuid: true,
    }).extend({
        inbound: z
            .object({
                configProfileUuid: z.uuid(),
                configProfileInboundUuid: z.uuid(),
            })
            .optional(),
        remark: z.string().min(1).max(100).optional(),
        address: z.string().optional(),
        port: z.int().optional(),
        path: z.string().nullish(),
        sni: z.string().nullish(),
        host: z.string().nullish(),
        alpn: z.enum(ALPN).nullish(),
        fingerprint: z.string().nullish(),
        isDisabled: z.optional(z.boolean()),
        securityLayer: z.optional(z.enum(SECURITY_LAYERS)),
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
        isHidden: z.optional(z.boolean()),
        overrideSniFromAddress: z.optional(z.boolean()),
        keepSniBlank: z.optional(z.boolean()),
        vlessRouteId: z.optional(z.int().min(0).max(65535).nullable()),
        pinnedPeerCertSha256: z.string().nullish(),
        verifyPeerCertByName: z.string().nullish(),
        shuffleHost: z.optional(z.boolean()),
        mihomoX25519: z.optional(z.boolean()),
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
