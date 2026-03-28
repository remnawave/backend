import { SplitHTTPMode, TCPHeaderHTTP, TCPHeaderNone, VLessFlow } from 'xray-typed';

import { TSubscriptionTemplateType } from '@libs/contracts/constants';

// ─── Protocol Options ────────────────────────────────────

export interface IVlessProtocolOptions {
    encryption: string;
    id: string;
    flow: VLessFlow;
}

export interface ITrojanProtocolOptions {
    password: string;
}

export interface IShadowsocksProtocolOptions {
    method: string;
    password: string;
    uot: boolean;
    uotVersion: number;
}

export interface IHysteriaProtocolOptions {
    version: number;
}

// ─── Transport Options ───────────────────────────────────

export interface ITcpTransportOptions {
    header: TCPHeaderNone | TCPHeaderHTTP | null;
}

export interface IXhttpTransportOptions {
    path: string | null;
    host: string | null;
    mode: SplitHTTPMode;
    extra: Record<string, unknown> | null;
}

export interface IWsTransportOptions {
    path: string | null;
    host: string | null;
    headers: Record<string, string> | null;
    heartbeatPeriod: number | null;
}

export interface IHttpUpgradeTransportOptions {
    path: string | null;
    host: string | null;
    headers: Record<string, string> | null;
}

export interface IGrpcTransportOptions {
    authority: string | null;
    serviceName: string | null;
    multiMode: boolean;
}

export interface IKcpTransportOptions {
    clientMtu: number;
    tti: number;
    congestion: boolean;
}

export interface IHysteriaTransportOptions {
    version: number;
    auth: string;
}

// ─── Security Options ────────────────────────────────────

export interface ITlsSecurityOptions {
    allowInsecure: boolean;
    alpn: string | null;
    enableSessionResumption: boolean;
    fingerprint: string | null;
    serverName: string | null;
    echConfigList: string | null;
    echForceQuery: string | null;
}

export interface IRealitySecurityOptions {
    fingerprint: string;
    publicKey: string;
    shortId: string | null;
    serverName: string;
    spiderX: string | null;
    mldsa65Verify: string | null;
}

// ─── Protocol Variants ───────────────────────────────────

export type VlessProtocol = {
    protocol: 'vless';
    protocolOptions: IVlessProtocolOptions;
};

export type TrojanProtocol = {
    protocol: 'trojan';
    protocolOptions: ITrojanProtocolOptions;
};

export type ShadowsocksProtocol = {
    protocol: 'shadowsocks';
    protocolOptions: IShadowsocksProtocolOptions;
};

export type HysteriaProtocol = {
    protocol: 'hysteria';
    protocolOptions: IHysteriaProtocolOptions;
};

export type ProtocolVariant =
    | VlessProtocol
    | TrojanProtocol
    | ShadowsocksProtocol
    | HysteriaProtocol;

// ─── Transport Variants ──────────────────────────────────

export type TcpTransport = {
    transport: 'tcp';
    transportOptions: ITcpTransportOptions;
};

export type XHttpTransport = {
    transport: 'xhttp';
    transportOptions: IXhttpTransportOptions;
};

export type WsTransport = {
    transport: 'ws';
    transportOptions: IWsTransportOptions;
};

export type HttpUpgradeTransport = {
    transport: 'httpupgrade';
    transportOptions: IHttpUpgradeTransportOptions;
};

export type GrpcTransport = {
    transport: 'grpc';
    transportOptions: IGrpcTransportOptions;
};

export type KcpTransport = {
    transport: 'kcp';
    transportOptions: IKcpTransportOptions;
};

export type HysteriaTransport = {
    transport: 'hysteria';
    transportOptions: IHysteriaTransportOptions;
};

export type TransportVariant =
    | TcpTransport
    | XHttpTransport
    | WsTransport
    | HttpUpgradeTransport
    | GrpcTransport
    | KcpTransport
    | HysteriaTransport;

// ─── Security Variants ───────────────────────────────────

type TlsSecurity = {
    security: 'tls';
    securityOptions: ITlsSecurityOptions;
};

type RealitySecurity = {
    security: 'reality';
    securityOptions: IRealitySecurityOptions;
};

type NoneSecurity = {
    security: 'none';
    securityOptions?: never;
};

export type SecurityVariant = TlsSecurity | RealitySecurity | NoneSecurity;

// ─── Metadata ────────────────────────────────────────────

export interface IProxyEntryMetadata {
    uuid: string;
    tag: string | null;
    excludeFromSubscriptionTypes: TSubscriptionTemplateType[];
    inboundTag: string;
    configProfileUuid: string | null;
    configProfileInboundUuid: string | null;
    isDisabled: boolean;
    isHidden: boolean;
    viewPosition: number;
    remark: string;
    vlessRouteId: number | null;
    rawInbound: object | null;
}

// ─── Resolved Proxy Config ───────────────────────────────

export type ResolvedProxyConfig = {
    finalRemark: string;
    address: string;
    port: number;

    streamOverrides: {
        finalMask: Record<string, unknown> | null;
        sockopt: Record<string, unknown> | null;
    };

    mux: Record<string, unknown> | null;

    clientOverrides: {
        shuffleHost: boolean;
        mihomoX25519: boolean;
        serverDescription: string | null;
        xrayJsonTemplate: object | null;
    };

    metadata: IProxyEntryMetadata;
} & ProtocolVariant &
    SecurityVariant &
    TransportVariant;
