import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyObject, parseIntRangeUtil } from '@common/utils';
import { FINGERPRINTS } from '@libs/contracts/constants';

import { SubscriptionTemplateService } from '@modules/subscription-template/subscription-template.service';

import { applyHostMapper } from '../host-mapper';
import { ResolvedProxyConfig } from '../resolve-proxy/interfaces';

/**
 * Target: sing-box 1.13.x
 * Reference: https://sing-box.sagernet.org/configuration/
 */

interface OutboundConfig {
    brutal_debug?: boolean;
    down_mbps?: number;
    flow?: string;
    hop_interval?: string;
    method?: string;
    multiplex?: MultiplexConfig;
    network?: string;
    obfs?: ObfsConfig;
    outbounds?: string[];
    password?: string;
    remnawave?: { includeProxies?: boolean };
    server: string;
    server_port: number;
    server_ports?: string[];
    tag: string;
    tls?: TlsConfig;
    transport?: TransportConfig;
    type: string;
    up_mbps?: number;
    uuid?: string;
    udp_over_tcp?: {
        enabled: boolean;
        version?: number;
    };
}

interface ObfsConfig {
    password: string;
    type: 'salamander';
}

interface MultiplexConfig {
    brutal?: {
        down_mbps: number;
        enabled: boolean;
        up_mbps: number;
    };
    enabled: boolean;
    max_connections?: number;
    max_streams?: number;
    min_streams?: number;
    padding?: boolean;
    protocol?: string;
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
    headers?: Record<string, string>;
    host?: string;
    max_early_data?: number;
    path?: string;
    service_name?: string;
    type: string;
}

interface Hysteria2FinalMask {
    quicParams?: {
        brutalDown?: number | string;
        brutalUp?: number | string;
        udpHop?: {
            interval?: number | string;
            ports?: number | string;
        };
    };
    udp?: Array<{
        settings?: { password?: string };
        type?: string;
    }>;
}

const UNSUPPORTED_TRANSPORTS = new Set(['kcp', 'xhttp']);
const PROXY_PROTOCOL_TYPES = new Set(['hysteria2', 'shadowsocks', 'trojan', 'vless']);
const SELECTOR_TYPES = new Set([...PROXY_PROTOCOL_TYPES, 'urltest']);
const MULTIPLEX_PROTOCOLS = new Set(['h2mux', 'smux', 'yamux']);
const DURATION_REGEX = /^\d+(\.\d+)?(ns|us|µs|ms|s|m|h)$/;

@Injectable()
export class SingBoxGeneratorService {
    private readonly logger = new Logger(SingBoxGeneratorService.name);

    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    public async generateConfig(
        hosts: ResolvedProxyConfig[],
        overrideTemplateName?: string,
    ): Promise<string> {
        try {
            const template = (await this.subscriptionTemplateService.getCachedTemplateByType(
                'SINGBOX',
                overrideTemplateName,
            )) as Record<string, unknown>;

            const userOutbounds: OutboundConfig[] = [];

            for (const host of hosts) {
                if (host.metadata.excludeFromSubscriptionTypes.includes('SINGBOX')) continue;
                if (UNSUPPORTED_TRANSPORTS.has(host.transport)) continue;

                const outbound = this.buildOutbound(host);
                if (!outbound) continue;

                userOutbounds.push(outbound);
            }

            return this.renderConfig(template, userOutbounds);
        } catch (error) {
            this.logger.error(`Error generating sing-box config: ${error}`);
            return '';
        }
    }

    private buildOutbound(host: ResolvedProxyConfig): null | OutboundConfig {
        try {
            const outbound = this.buildBaseOutbound(host);

            if (!outbound) return null;

            return applyHostMapper(
                outbound,
                host.clientOverrides.mapper.singbox,
                host.metadata.rawInbound,
            );
        } catch {
            return null;
        }
    }

    private buildBaseOutbound(host: ResolvedProxyConfig): null | OutboundConfig {
        if (host.protocol === 'hysteria') {
            return this.buildHysteria2Outbound(host);
        }

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
        this.applyMultiplex(config, host);

        return config;
    }

    private applyProtocolFields(config: OutboundConfig, host: ResolvedProxyConfig): boolean {
        switch (host.protocol) {
            case 'vless':
                if (host.protocolOptions.encryption && host.protocolOptions.encryption !== 'none') {
                    return false;
                }

                config.uuid = host.protocolOptions.id;

                if (
                    host.protocolOptions.flow === 'xtls-rprx-vision' &&
                    host.transport === 'tcp' &&
                    host.security !== 'none'
                ) {
                    config.flow = host.protocolOptions.flow;
                }
                return true;

            case 'trojan':
                config.password = host.protocolOptions.password;
                return true;

            case 'shadowsocks':
                config.password = host.protocolOptions.password;
                config.method = host.protocolOptions.method;

                if (host.protocolOptions.uot) {
                    config.network = 'tcp';
                    config.udp_over_tcp = {
                        enabled: true,
                        ...(host.protocolOptions.uotVersion === 1 && { version: 1 }),
                    };
                }
                return true;

            default:
                return false;
        }
    }

    private applyMultiplex(config: OutboundConfig, host: ResolvedProxyConfig): void {
        if (config.udp_over_tcp?.enabled) return;

        const multiplex = this.buildMultiplexConfig(host.mux);

        if (multiplex) {
            config.multiplex = multiplex;
        }
    }

    private buildMultiplexConfig(mux: null | Record<string, unknown>): MultiplexConfig | null {
        const smux = mux?.smux;

        if (!isNonEmptyObject(smux) || smux.enabled !== true) return null;

        const config: MultiplexConfig = { enabled: true };

        if (typeof smux.protocol === 'string' && MULTIPLEX_PROTOCOLS.has(smux.protocol)) {
            config.protocol = smux.protocol;
        }

        const maxConnections = this.parsePositiveInt(smux['max-connections']);
        const minStreams = this.parsePositiveInt(smux['min-streams']);
        const maxStreams = this.parsePositiveInt(smux['max-streams']);

        if (maxConnections) config.max_connections = maxConnections;
        if (minStreams) config.min_streams = minStreams;
        if (maxStreams) config.max_streams = maxStreams;

        if (smux.padding === true) config.padding = true;

        const brutal = smux['brutal-opts'];

        if (isNonEmptyObject(brutal) && brutal.enabled === true) {
            const upMbps = this.parseMbps(brutal.up);
            const downMbps = this.parseMbps(brutal.down);

            if (upMbps && downMbps) {
                config.brutal = { enabled: true, up_mbps: upMbps, down_mbps: downMbps };
            }
        }

        return config;
    }

    private parsePositiveInt(value: unknown): null | number {
        if (typeof value !== 'number' && typeof value !== 'string') return null;

        const parsed = parseInt(String(value).trim(), 10);

        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private buildHysteria2Outbound(
        host: Extract<ResolvedProxyConfig, { protocol: 'hysteria' }>,
    ): null | OutboundConfig {
        if (host.transport !== 'hysteria') return null;

        const config: OutboundConfig = {
            type: 'hysteria2',
            tag: host.finalRemark,
            server: host.address,
            server_port: host.port,
            password: host.transportOptions.auth,
            tls: this.buildQuicTlsConfig(host),
        };

        const finalMask = host.streamOverrides.finalMask as Hysteria2FinalMask | null;
        const { brutalDown, brutalUp, udpHop } = finalMask?.quicParams ?? {};

        const upMbps = this.parseMbps(brutalUp);
        const downMbps = this.parseMbps(brutalDown);

        if (upMbps) config.up_mbps = upMbps;
        if (downMbps) config.down_mbps = downMbps;

        const serverPorts = this.parsePortRanges(udpHop?.ports);
        if (serverPorts.length > 0) {
            config.server_ports = serverPorts;

            const hopInterval = this.parseDuration(udpHop?.interval);
            if (hopInterval) config.hop_interval = hopInterval;
        }

        const obfs = this.buildObfsConfig(finalMask);
        if (obfs) config.obfs = obfs;

        return config;
    }

    private buildObfsConfig(finalMask: Hysteria2FinalMask | null): null | ObfsConfig {
        if (!Array.isArray(finalMask?.udp)) return null;

        const mask = finalMask.udp.find(
            (item) => item?.type === 'salamander' && item.settings?.password,
        );

        if (!mask?.settings?.password) return null;

        return { type: 'salamander', password: mask.settings.password };
    }

    private parseMbps(value: unknown): null | number {
        return this.parsePositiveInt(value);
    }

    private parsePortRanges(value: number | string | undefined): string[] {
        if (value === undefined || value === null || value === '') return [];

        const ranges: string[] = [];

        for (const part of String(value).split(',')) {
            const { from, to } = parseIntRangeUtil(part.trim());

            if (from === null || from === 0 || from > 65535) continue;

            const end = to === null || to > 65535 ? from : to;

            ranges.push(`${from}:${end}`);
        }

        return ranges;
    }

    private parseDuration(value: number | string | undefined): null | string {
        if (value === undefined || value === null || value === '') return null;

        const raw = String(value).trim();

        if (/^\d+$/.test(raw)) {
            return Number(raw) > 0 ? `${raw}s` : null;
        }

        return DURATION_REGEX.test(raw) ? raw : null;
    }

    private applyTransport(config: OutboundConfig, host: ResolvedProxyConfig): void {
        switch (host.transport) {
            case 'ws':
                config.transport = this.buildWsTransport(
                    host.transportOptions.path,
                    host.transportOptions.host,
                    host.transportOptions.headers,
                );
                break;

            case 'httpupgrade':
                config.transport = this.buildHttpUpgradeTransport(
                    host.transportOptions.path,
                    host.transportOptions.host,
                    host.transportOptions.headers,
                );
                break;

            case 'grpc':
                config.transport = this.buildGrpcTransport(host.transportOptions.serviceName);
                break;

            default:
                break;
        }
    }

    private buildWsTransport(
        rawPath: null | string,
        host: null | string,
        rawHeaders: null | Record<string, string>,
    ): TransportConfig {
        const config: TransportConfig = {
            type: 'ws',
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

        const headers = this.buildHeaders(rawHeaders, host);
        if (headers) {
            config.headers = headers;
        }

        return config;
    }

    private buildHttpUpgradeTransport(
        rawPath: null | string,
        host: null | string,
        rawHeaders: null | Record<string, string>,
    ): TransportConfig {
        const config: TransportConfig = {
            type: 'httpupgrade',
        };

        const path = rawPath ?? '';

        if (path) {
            config.path = path;
        }

        if (host) {
            config.host = host;
        }

        const headers = this.buildHeaders(rawHeaders, null);
        if (headers) {
            config.headers = headers;
        }

        return config;
    }

    private buildGrpcTransport(serviceName: null | string): TransportConfig {
        return {
            type: 'grpc',
            service_name: serviceName ?? '',
        };
    }

    private buildHeaders(
        rawHeaders: null | Record<string, string>,
        host: null | string,
    ): null | Record<string, string> {
        const headers: Record<string, string> = {};

        if (rawHeaders) {
            for (const [key, value] of Object.entries(rawHeaders)) {
                if (key.toLowerCase() === 'host' && !host) continue;
                if (typeof value !== 'string') continue;

                headers[key] = value;
            }
        }

        if (host) {
            headers.Host = host;
        }

        return Object.keys(headers).length > 0 ? headers : null;
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
                fingerprint: this.resolveFingerprint(opts.fingerprint),
            };
        }

        // allowInsecure
        if (opts.pinnedPeerCertSha256) {
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
            fingerprint: this.resolveFingerprint(opts.fingerprint),
        };

        return config;
    }

    private buildQuicTlsConfig(host: ResolvedProxyConfig): TlsConfig {
        const config: TlsConfig = {
            enabled: true,
        };

        if (host.security !== 'tls') {
            return config;
        }

        const opts = host.securityOptions;

        if (opts.serverName) {
            config.server_name = opts.serverName;
        }

        // allowInsecure
        if (opts.pinnedPeerCertSha256) {
            config.insecure = true;
        }

        if (opts.alpn) {
            config.alpn = opts.alpn.split(',').map((a) => a.trim());
        }

        return config;
    }

    private resolveFingerprint(fingerprint: null | string): string {
        return FINGERPRINTS.find((fp) => fingerprint?.includes(fp)) ?? 'chrome';
    }

    private renderConfig(
        template: Record<string, unknown>,
        userOutbounds: OutboundConfig[],
    ): string {
        const allOutbounds = [...(template.outbounds as OutboundConfig[]), ...userOutbounds];

        const urltestTags = allOutbounds
            .filter((o) => PROXY_PROTOCOL_TYPES.has(o.type))
            .map((o) => o.tag);

        const selectorTags = allOutbounds
            .filter((o) => SELECTOR_TYPES.has(o.type))
            .map((o) => o.tag);

        const finalOutbounds = allOutbounds.map((outbound) => {
            const { remnawave, ...cleanOutbound } = outbound;

            if (remnawave?.includeProxies === false) {
                return cleanOutbound;
            }
            if (cleanOutbound.type === 'urltest') {
                return { ...cleanOutbound, outbounds: urltestTags };
            }
            if (cleanOutbound.type === 'selector') {
                return { ...cleanOutbound, outbounds: selectorTags };
            }
            return cleanOutbound;
        });

        return JSON.stringify({ ...template, outbounds: finalOutbounds }, null, 0);
    }
}
