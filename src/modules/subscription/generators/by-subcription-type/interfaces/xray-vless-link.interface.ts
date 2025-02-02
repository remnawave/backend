export interface XrayVlessLink {
    address: string;
    ais?: boolean;
    alpn?: string;
    flow?: string;
    fp?: string;
    fs?: string;
    heartbeatPeriod?: number;
    host?: string;
    id: string;
    keepAlivePeriod?: number;
    mode?: string;
    multiMode?: boolean;
    net?: string;
    noGRPCHeader?: boolean;
    path?: string;
    pbk?: string;
    port: number;
    protocol: string;
    remark: string;
    scMaxConcurrentPosts?: number;
    scMaxEachPostBytes?: number;
    scMinPostsIntervalMs?: number;
    sid?: string;
    sni?: string;
    spx?: string;
    tls?: string;
    type?: string;
    xmux?: Record<string, unknown>;
    xPaddingBytes?: string;
}
