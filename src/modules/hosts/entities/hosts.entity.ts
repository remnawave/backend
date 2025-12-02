import { Hosts } from '@prisma/client';

import { TSecurityLayers } from '@contract/constants';

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
    vlessRouteId: number | null;
    shuffleHost: boolean;
    mihomoX25519: boolean;

    configProfileUuid: string | null;
    configProfileInboundUuid: string | null;

    xrayJsonTemplateUuid: string | null;

    nodes: {
        nodeUuid: string;
    }[];

    excludedInternalSquads: {
        squadUuid: string;
    }[];

    constructor(data: Partial<Hosts>) {
        Object.assign(this, data);
    }
}
