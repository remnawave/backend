export interface TLSObject {
    serverName?: string;
    rejectUnknownSni?: boolean;
    alpn?: string[];
    allowInsecure?: boolean;
    certificates?: CertificateObject[];
    cipherSuites?: string;
    disableSystemRoot?: boolean;
    enableSessionResumption?: boolean;
    fingerprint?: string;
    maxVersion?: string;
    minVersion?: string;
    pinnedPeerCertificateChainSha256?: string[];
}

export interface CertificateObject {
    certificate?: string[];
    certificateFile?: string;
    key?: string[];
    keyFile?: string;
    ocspStapling?: number;
    oneTimeLoading?: boolean;
    usage?: string;
}

export interface RealityObject {
    show?: boolean;
    dest?: string;
    serverNames?: string[];
    privateKey?: string;
    publicKey?: string;
    password?: string;
    maxClientVer?: string;
    maxTimeDiff?: number;
    minClientVer?: string;
    shortIds?: string[];
    spiderX?: string;
    xver?: number;
    fingerprint?: string;
}

export interface TcpObject {
    acceptProxyProtocol?: boolean;
    header?: {
        request?: {
            headers?: Record<string, string[]>;
            method?: string;
            path?: string[];
            version?: string;
        };
        response?: {
            headers?: Record<string, string[]>;
            reason?: string;
            status?: string;
            version?: string;
        };
        type: string;
    };
}

export interface RawObject {
    acceptProxyProtocol?: boolean;
    header?: {
        request?: {
            headers?: Record<string, string[]>;
            method?: string;
            path?: string[];
            version?: string;
        };
        response?: {
            headers?: Record<string, string[]>;
            reason?: string;
            status?: string;
            version?: string;
        };
        type: string;
    };
}

export interface xHttpObject {
    host?: string;
    path?: string;
    mode?: string;
    extra?: {
        headers?: Record<string, string>;
        scMaxEachPostBytes?: number;
        scMaxBufferedPosts?: number;
        scMaxConcurrentPosts?: number;
        scMinPostsIntervalMs?: number;
        xPaddingBytes?: string;
        noGRPCHeader?: boolean;
        heartbeatPeriod?: number;
        keepAlivePeriod?: number;
    };
}

export interface KcpObject {
    congestion?: boolean;
    downlinkCapacity?: number;
    header?: {
        type?: string;
    };
    mtu?: number;
    readBufferSize?: number;
    seed?: string;
    tti?: number;
    uplinkCapacity?: number;
    writeBufferSize?: number;
}

export interface DomainSocketObject {
    abstract?: boolean;
    padding?: boolean;
    path: string;
}

export interface StreamSettingsObject {
    network: 'raw' | 'xhttp' | 'ws' | 'tcp' | 'httpupgrade' | 'grpc';
    security?: 'none' | 'reality' | 'tls';
    tlsSettings?: TLSObject;
    realitySettings?: RealityObject;
    rawSettings?: RawObject;
    tcpSettings?: TcpObject;
    xhttpSettings?: xHttpObject;
    wsSettings?: WebSocketObject;
    httpupgradeSettings?: HttpUpgradeObject;
    grpcSettings?: GrpcObject;
    sockopt?: unknown;
}

export interface WebSocketObject {
    acceptProxyProtocol?: boolean;
    headers?: Record<string, string>;
    path?: string;
}

export interface HttpUpgradeObject {
    acceptProxyProtocol?: boolean;
    headers?: Record<string, string>;
    path?: string;
}

export interface GrpcObject {
    authority?: string;
    serviceName?: string;
    multiMode?: boolean;
    user_agent?: string;
    idle_timeout?: number;
    health_check_timeout?: number;
    permit_without_stream?: boolean;
    initial_windows_size?: number;
}

export type OneOfStreamSettingsObject =
    | TLSObject
    | RealityObject
    | RawObject
    | TcpObject
    | xHttpObject
    | WebSocketObject
    | HttpUpgradeObject
    | GrpcObject;
