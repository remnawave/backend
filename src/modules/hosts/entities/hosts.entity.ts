import {
    SUBSCRIPTION_TEMPLATE_TYPE_VALUES,
    TInternalSquadsMode,
    TMihomoIpVersion,
    TSecurityLayers,
    TSubscriptionTemplateType,
} from '@contract/constants';
import { Hosts } from '@prisma/client';

import { THostMapper } from '@libs/contracts/models';

export class HostsEntity implements Hosts {
    uuid: string;
    viewPosition: number;
    remark: string;
    address: string;
    port: number;
    path: null | string;
    sni: null | string;
    host: null | string;
    alpn: null | string;
    fingerprint: null | string;
    securityLayer: TSecurityLayers;
    xhttpExtraParams: null | object;
    muxParams: null | object;
    sockoptParams: null | object;
    finalMask: null | object;
    isDisabled: boolean;
    serverDescription: null | string;
    pinnedPeerCertSha256: string | null;
    verifyPeerCertByName: string | null;
    mihomoIpVersion: TMihomoIpVersion | null;
    tags: string[];
    isHidden: boolean;

    overrideSniFromAddress: boolean;
    keepSniBlank: boolean;
    vlessRouteId: number | null;
    shuffleHost: boolean;
    mihomoX25519: boolean;

    configProfileUuid: string | null;
    configProfileInboundUuid: string | null;

    xrayJsonTemplateUuid: string | null;
    excludeFromSubscriptionTypes: TSubscriptionTemplateType[];

    nodes: {
        nodeUuid: string;
    }[];

    mapper: THostMapper;

    internalSquadsMode: TInternalSquadsMode;
    internalSquads: {
        squadUuid: string;
    }[];

    constructor(data: Partial<Hosts>) {
        Object.assign(this, data);

        if (data.excludeFromSubscriptionTypes) {
            this.excludeFromSubscriptionTypes = data.excludeFromSubscriptionTypes.filter(
                (v): v is TSubscriptionTemplateType =>
                    SUBSCRIPTION_TEMPLATE_TYPE_VALUES.includes(v as TSubscriptionTemplateType),
            );
        }
    }
}
