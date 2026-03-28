import { z } from 'zod';

import { SUBSCRIPTION_TEMPLATE_TYPE } from '../constants';

export const VlessProtocolOptionsSchema = z.object({
    encryption: z.string(),
    id: z.string(),
    flow: z.enum(['', 'xtls-rprx-vision', 'xtls-rprx-vision-udp443']),
});

export const TrojanProtocolOptionsSchema = z.object({
    password: z.string(),
});

export const ShadowsocksProtocolOptionsSchema = z.object({
    method: z.string(),
    password: z.string(),
    uot: z.boolean(),
    uotVersion: z.number().int(),
});

const TcpHeaderNoneSchema = z.object({
    type: z.literal('none'),
});

const TcpHeaderHttpRequestSchema = z.object({
    version: z.string().optional(),
    method: z.string().optional(),
    path: z.array(z.string()).optional(),
    headers: z.record(z.unknown()).optional(),
});

const TcpHeaderHttpResponseSchema = z.object({
    version: z.string().optional(),
    status: z.string().optional(),
    reason: z.string().optional(),
    headers: z.record(z.unknown()).optional(),
});

const TcpHeaderHttpSchema = z.object({
    type: z.literal('http'),
    request: TcpHeaderHttpRequestSchema.optional(),
    response: TcpHeaderHttpResponseSchema.optional(),
});

const TcpHeaderSchema = z.discriminatedUnion('type', [TcpHeaderNoneSchema, TcpHeaderHttpSchema]);

export const TcpTransportOptionsSchema = z.object({
    header: TcpHeaderSchema.nullable(),
});

export const XhttpTransportOptionsSchema = z.object({
    path: z.string().nullable(),
    host: z.string().nullable(),
    mode: z.enum(['auto', 'packet-up', 'stream-up', 'stream-one']),
    extra: z.record(z.unknown()).nullable(),
});

export const WsTransportOptionsSchema = z.object({
    path: z.string().nullable(),
    host: z.string().nullable(),
    headers: z.record(z.string()).nullable(),
    heartbeatPeriod: z.number().nullable(),
});

export const HttpUpgradeTransportOptionsSchema = z.object({
    path: z.string().nullable(),
    host: z.string().nullable(),
    headers: z.record(z.string()).nullable(),
});

export const GrpcTransportOptionsSchema = z.object({
    authority: z.string().nullable(),
    serviceName: z.string().nullable(),
    multiMode: z.boolean(),
});

export const KcpTransportOptionsSchema = z.object({
    clientMtu: z.number().int(),
    tti: z.number().int(),
    congestion: z.boolean(),
});

export const HysteriaProtocolOptionsSchema = z.object({
    version: z.number().int(),
});

export const HysteriaTransportOptionsSchema = z.object({
    version: z.number().int(),
    auth: z.string(),
});

export const TlsSecurityOptionsSchema = z.object({
    allowInsecure: z.boolean(),
    alpn: z.string().nullable(),
    enableSessionResumption: z.boolean(),
    fingerprint: z.string().nullable(),
    serverName: z.string().nullable(),
    echConfigList: z.string().nullable(),
    echForceQuery: z.string().nullable(),
});

export const RealitySecurityOptionsSchema = z.object({
    fingerprint: z.string(),
    publicKey: z.string(),
    shortId: z.string().nullable(),
    serverName: z.string(),
    spiderX: z.string().nullable(),
    mldsa65Verify: z.string().nullable(),
});

const VlessProtocolSchema = z.object({
    protocol: z.literal('vless'),
    protocolOptions: VlessProtocolOptionsSchema,
});

const TrojanProtocolSchema = z.object({
    protocol: z.literal('trojan'),
    protocolOptions: TrojanProtocolOptionsSchema,
});

const ShadowsocksProtocolSchema = z.object({
    protocol: z.literal('shadowsocks'),
    protocolOptions: ShadowsocksProtocolOptionsSchema,
});

const HysteriaProtocolSchema = z.object({
    protocol: z.literal('hysteria'),
    protocolOptions: HysteriaProtocolOptionsSchema,
});

export const ProtocolVariantSchema = z.discriminatedUnion('protocol', [
    VlessProtocolSchema,
    TrojanProtocolSchema,
    ShadowsocksProtocolSchema,
    HysteriaProtocolSchema,
]);

const TcpTransportSchema = z.object({
    transport: z.literal('tcp'),
    transportOptions: TcpTransportOptionsSchema,
});

const XHttpTransportSchema = z.object({
    transport: z.literal('xhttp'),
    transportOptions: XhttpTransportOptionsSchema,
});

const WsTransportSchema = z.object({
    transport: z.literal('ws'),
    transportOptions: WsTransportOptionsSchema,
});

const HttpUpgradeTransportSchema = z.object({
    transport: z.literal('httpupgrade'),
    transportOptions: HttpUpgradeTransportOptionsSchema,
});

const GrpcTransportSchema = z.object({
    transport: z.literal('grpc'),
    transportOptions: GrpcTransportOptionsSchema,
});

const KcpTransportSchema = z.object({
    transport: z.literal('kcp'),
    transportOptions: KcpTransportOptionsSchema,
});

const HysteriaTransportSchema = z.object({
    transport: z.literal('hysteria'),
    transportOptions: HysteriaTransportOptionsSchema,
});

export const TransportVariantSchema = z.discriminatedUnion('transport', [
    TcpTransportSchema,
    XHttpTransportSchema,
    WsTransportSchema,
    HttpUpgradeTransportSchema,
    GrpcTransportSchema,
    KcpTransportSchema,
    HysteriaTransportSchema,
]);

const TlsSecuritySchema = z.object({
    security: z.literal('tls'),
    securityOptions: TlsSecurityOptionsSchema,
});

const RealitySecuritySchema = z.object({
    security: z.literal('reality'),
    securityOptions: RealitySecurityOptionsSchema,
});

const NoneSecuritySchema = z.object({
    security: z.literal('none'),
});

export const SecurityVariantSchema = z.discriminatedUnion('security', [
    TlsSecuritySchema,
    RealitySecuritySchema,
    NoneSecuritySchema,
]);

export const ProxyEntryMetadataSchema = z.object({
    uuid: z.string().uuid(),
    tag: z.string().nullable(),
    excludeFromSubscriptionTypes: z.array(z.nativeEnum(SUBSCRIPTION_TEMPLATE_TYPE)),
    inboundTag: z.string(),
    configProfileUuid: z.string().uuid().nullable(),
    configProfileInboundUuid: z.string().uuid().nullable(),
    isDisabled: z.boolean(),
    isHidden: z.boolean(),
    viewPosition: z.number().int(),
    remark: z.string(),
    vlessRouteId: z.number().int().nullable(),
    rawInbound: z.nullable(z.unknown()),
});

export const ResolvedProxyConfigSchema = z.object({
    finalRemark: z.string(),
    address: z.string(),
    port: z.number().int().positive(),

    protocol: z.enum(['vless', 'trojan', 'shadowsocks', 'hysteria']),
    protocolOptions: z.union([
        VlessProtocolOptionsSchema,
        TrojanProtocolOptionsSchema,
        ShadowsocksProtocolOptionsSchema,
        HysteriaProtocolOptionsSchema,
    ]),

    transport: z.enum(['tcp', 'xhttp', 'ws', 'httpupgrade', 'grpc', 'kcp', 'hysteria']),
    transportOptions: z.union([
        TcpTransportOptionsSchema,
        XhttpTransportOptionsSchema,
        WsTransportOptionsSchema,
        HttpUpgradeTransportOptionsSchema,
        GrpcTransportOptionsSchema,
        KcpTransportOptionsSchema,
        HysteriaTransportOptionsSchema,
    ]),

    security: z.enum(['tls', 'reality', 'none']),
    securityOptions: z.union([TlsSecurityOptionsSchema, RealitySecurityOptionsSchema]).optional(),

    streamOverrides: z.object({
        finalMask: z.nullable(z.unknown()),
        sockopt: z.nullable(z.unknown()),
    }),

    mux: z.nullable(z.unknown()),

    clientOverrides: z.object({
        shuffleHost: z.boolean(),
        mihomoX25519: z.boolean(),
        serverDescription: z.string().nullable(),
        xrayJsonTemplate: z.nullable(z.unknown()),
    }),

    metadata: ProxyEntryMetadataSchema,
});
