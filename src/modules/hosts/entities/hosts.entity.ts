import { Hosts } from '@prisma/client';

import {
    SUBSCRIPTION_TEMPLATE_TYPE_VALUES,
    TSecurityLayers,
    TSubscriptionTemplateType,
} from '@contract/constants';

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
    xHttpExtraParams: null | object;
    muxParams: null | object;
    sockoptParams: null | object;
    isDisabled: boolean;
    serverDescription: null | string;
    allowInsecure: boolean;

    tag: null | string;
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

    excludedInternalSquads: {
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
