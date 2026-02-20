import { IFormattedHost } from './formatted-hosts.interface';

export interface IInjectHostsEntry {
    hostUuids: string[];
    tagPrefix: string;
}

export interface IRemnawaveInjector {
    injectHosts?: IInjectHostsEntry[];
}

export interface StreamSettings {
    network: string;
    security?: string;
    wsSettings?: unknown;
    tcpSettings?: unknown;
    rawSettings?: unknown;
    xhttpSettings?: unknown;
    tlsSettings?: unknown;
    httpupgradeSettings?: unknown;
    realitySettings?: unknown;
    grpcSettings?: unknown;
    sockopt?: unknown;
}

export interface OutboundSettings {
    vnext?: Array<{
        address: string;
        port: number;
        users: Array<{
            id: string;
            security?: string;
            encryption?: string;
            flow?: string;
            alterId?: number;
            email?: string;
        }>;
    }>;
    servers?: Array<{
        address: string;
        port: number;
        password?: string;
        email?: string;
        method?: string;
        uot?: boolean;
        ivCheck?: boolean;
    }>;
}

export interface Outbound {
    tag: string;
    protocol: string;
    settings: OutboundSettings;
    streamSettings?: StreamSettings;
    mux?: unknown;
}

export interface XrayJsonConfig {
    remarks: string;
    outbounds: Outbound[];
    meta?: {
        serverDescription?: string;
    };
    remnawave?: IRemnawaveInjector;
}

export interface IGenerateConfigParams {
    hosts: IFormattedHost[];
    isHapp: boolean;
    overrideTemplateName?: string;
    ignoreHostXrayJsonTemplate?: boolean;
}
