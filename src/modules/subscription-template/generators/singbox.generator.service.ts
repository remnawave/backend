import { Injectable } from '@nestjs/common';

import { SubscriptionTemplateService } from '@modules/subscription-template/subscription-template.service';

import { ResolvedProxyConfig } from '../resolve-proxy/interfaces';

interface OutboundConfig {
    flow?: string;
    method?: string;
    multiplex?: unknown;
    network?: string;
    outbounds?: string[];
    password?: string;
    server: string;
    server_port: number;
    tag: string;
    tls?: TlsConfig;
    transport?: TransportConfig;
    type: string;
    uuid?: string;
    udp_over_tcp?: {
        enabled: boolean;
        version: number;
    };
}

interface TlsConfig {
    alpn?: string[];
    enabled?: boolean;
    insecure?: boolean;
    reality?: {
        enabled: boolean;
        public_key?: string;
        short_id?: string;
    };
    server_name?: string;
    utls?: {
        enabled: boolean;
        fingerprint: string;
    };
}

interface TransportConfig {
    early_data_header_name?: string;
    headers?: Record<string, unknown>;
    max_early_data?: number;
    path?: string;
    service_name?: string;
    type: string;
}

const UNSUPPORTED_TRANSPORTS = new Set(['hysteria', 'kcp', 'xhttp']);
const PROXY_PROTOCOL_TYPES = new Set(['hysteria', 'shadowsocks', 'trojan', 'vless']);
const SELECTOR_TYPES = new Set(['shadowsocks', 'trojan', 'urltest', 'vless']);

@Injectable()
export class SingBoxGeneratorService {
    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    public async generateConfig(
        hosts: ResolvedProxyConfig[],
        overrideTemplateName?: string,
    ): Promise<string> {
        try {
            const config = await this.subscriptionTemplateService.getCachedTemplateByType(
                'SINGBOX',
                overrideTemplateName,
            );

            for (const host of hosts) {
                if (host.metadata.excludeFromSubscriptionTypes.includes('SINGBOX')) continue;
                if (UNSUPPORTED_TRANSPORTS.has(host.transport)) continue;

                const outbound = this.buildOutbound(host);
                if (!outbound) continue;

                (config as Record<string, unknown[]>).outbounds.push(outbound);
            }

            return this.renderConfig(config as Record<string, unknown>);
        } catch {
            return '';
        }
    }

    private buildOutbound(host: ResolvedProxyConfig): OutboundConfig | null {
        try {
            const config: OutboundConfig = {
                type: host.protocol,
                tag: host.finalRemark,
                server: host.address,
                server_port: host.port,
            };

            if (!this.applyProtocolFields(config, host)) {
                return null;
            }

            this.applyTransport(config, host);
            this.applySecurity(config, host);

            return config;
        } catch {
            return null;
        }
    }

    private applyProtocolFields(config: OutboundConfig, host: ResolvedProxyConfig): boolean {
        switch (host.protocol) {
            case 'vless':
                config.uuid = host.protocolOptions.id;

                if (host.protocolOptions.flow === 'xtls-rprx-vision') {
                    config.flow = host.protocolOptions.flow;
                }
                return true;

            case 'trojan':
                config.password = host.protocolOptions.password;
                return true;

            case 'shadowsocks':
                config.password = host.protocolOptions.password;
                config.method = host.protocolOptions.method;
                config.network = 'tcp';
                config.udp_over_tcp = {
                    enabled: host.protocolOptions.uot,
                    version: host.protocolOptions.uotVersion,
                };
                return true;

            default:
                return false;
        }
    }

    private applyTransport(config: OutboundConfig, host: ResolvedProxyConfig): void {
        switch (host.transport) {
            case 'ws':
                config.transport = this.buildWsTransport(
                    host.transportOptions.path,
                    host.transportOptions.host,
                );
                break;

            case 'httpupgrade':
                config.transport = this.buildHttpUpgradeTransport(
                    host.transportOptions.path,
                    host.transportOptions.host,
                );
                break;

            case 'grpc':
                config.transport = this.buildGrpcTransport(host.transportOptions.serviceName);
                break;

            default:
                break;
        }
    }

    private buildWsTransport(rawPath: string | null, host: string | null): TransportConfig {
        const config: TransportConfig = {
            type: 'ws',
            headers: {},
        };

        let path = rawPath ?? '';

        if (path.includes('?ed=')) {
            const [pathPart, edPart] = path.split('?ed=');
            path = pathPart;
            const parsed = Number(edPart.split('/')[0]);
            if (!isNaN(parsed)) {
                config.max_early_data = parsed;
            }
            config.early_data_header_name = 'Sec-WebSocket-Protocol';
        }

        if (path) {
            config.path = path;
        }

        if (host) {
            config.headers = { Host: host };
        }

        return config;
    }

    private buildHttpUpgradeTransport(
        rawPath: string | null,
        host: string | null,
    ): TransportConfig {
        const config: TransportConfig = {
            type: 'httpupgrade',
            headers: {},
        };

        const path = rawPath ?? '';

        if (path) {
            config.path = path;
        }

        if (host) {
            config.headers = { Host: host };
        }

        return config;
    }

    private buildGrpcTransport(serviceName: string | null): TransportConfig {
        return {
            type: 'grpc',
            service_name: serviceName ?? '',
        };
    }

    private applySecurity(config: OutboundConfig, host: ResolvedProxyConfig): void {
        switch (host.security) {
            case 'tls':
                config.tls = this.buildTlsConfig(host);
                break;
            case 'reality':
                config.tls = this.buildRealityConfig(host);
                break;
            case 'none':
                break;
        }
    }

    private buildTlsConfig(host: Extract<ResolvedProxyConfig, { security: 'tls' }>): TlsConfig {
        const opts = host.securityOptions;
        const config: TlsConfig = {
            enabled: true,
        };

        if (opts.serverName) {
            config.server_name = opts.serverName;
        }

        if (opts.fingerprint) {
            config.utls = {
                enabled: true,
                fingerprint: opts.fingerprint,
            };
        }

        if (opts.allowInsecure) {
            config.insecure = true;
        }

        if (opts.alpn) {
            config.alpn = opts.alpn.split(',').map((a) => a.trim());
        }

        return config;
    }

    private buildRealityConfig(
        host: Extract<ResolvedProxyConfig, { security: 'reality' }>,
    ): TlsConfig {
        const opts = host.securityOptions;
        const config: TlsConfig = {
            enabled: true,
            reality: { enabled: true },
        };

        if (opts.serverName) {
            config.server_name = opts.serverName;
        }

        if (opts.publicKey) {
            config.reality!.public_key = opts.publicKey;
        }

        if (opts.shortId) {
            config.reality!.short_id = opts.shortId;
        }

        config.utls = {
            enabled: true,
            fingerprint: opts.fingerprint || 'chrome',
        };

        return config;
    }

    private renderConfig(config: Record<string, unknown>): string {
        const outbounds = config.outbounds as OutboundConfig[];

        const urltestTags = outbounds
            .filter((o) => PROXY_PROTOCOL_TYPES.has(o.type))
            .map((o) => o.tag);

        const selectorTags = outbounds.filter((o) => SELECTOR_TYPES.has(o.type)).map((o) => o.tag);

        for (const outbound of outbounds) {
            if (outbound.type === 'urltest') {
                outbound.outbounds = urltestTags;
            }
            if (outbound.type === 'selector') {
                outbound.outbounds = selectorTags;
            }
        }

        return JSON.stringify(config, null, 4);
    }
}
