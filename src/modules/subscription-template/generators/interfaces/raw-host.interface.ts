import { StreamSettingsObject } from '@common/helpers/xray-config/interfaces/transport.config';

export interface IDbHostData {
    rawInbound: object | null;
    inboundTag: string;
    uuid: string;
    configProfileUuid: string | null;
    configProfileInboundUuid: string | null;
    isDisabled: boolean;
    viewPosition: number;
    remark: string;
    isHidden: boolean;
    tag: string | null;
    vlessRouteId: number | null;
}

export interface IRawHost {
    dbData?: IDbHostData;
    address: string;
    alpn: string;
    fingerprint: string;
    host: string;
    network: StreamSettingsObject['network'];
    password: {
        ssPassword: string;
        trojanPassword: string;
        vlessPassword: string;
    };
    path: string;
    publicKey: string;
    port: number;
    protocol: string;
    remark: string;
    shortId: string;
    sni: string;
    spiderX: string;
    tls: string;
    headerType?: string;
    additionalParams?: {
        mode?: string;
        heartbeatPeriod?: number;
    };
    xHttpExtraParams?: null | object;
    serverDescription?: string;
    flow?: string;
    allowInsecure?: boolean;
    shuffleHost?: boolean;
    mihomoX25519?: boolean;
    protocolOptions?: {
        ss?: {
            method: string;
        };
    };
}
