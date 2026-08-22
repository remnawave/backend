import { Injectable, Logger } from '@nestjs/common';

import { THostMapperOperation } from '@libs/contracts/models';

import { applyHostMapper } from '../host-mapper';
import { ResolvedProxyConfig } from '../resolve-proxy/interfaces';

interface ShareLink {
    address: string;
    method?: string;
    params: Record<string, unknown>;
    password: string;
    port: number;
    remark: string;
    scheme: 'hysteria2' | 'ss' | 'trojan' | 'vless';
}

const LINK_TARGET_PREFIX = '$link.';
const LINK_ALLOWED_TARGETS = new Set(['address', 'method', 'password', 'port', 'remark']);

interface Hysteria2FinalMask {
    quicParams?: {
        brutalUp?: string | number;
        brutalDown?: string | number;
        udpHop?: {
            ports?: string | number;
            interval?: string | number;
        };
    };
    udp?: Array<{
        type?: string;
        settings?: { password?: string };
    }>;
}

/**
 * Generates VLESS/Trojan/Shadowsocks share links per the standard:
 * https://github.com/XTLS/Xray-core/discussions/716
 *
 * Format: protocol://$(uuid)@remote-host:remote-port?<params>#$(descriptive-text)
 */

@Injectable()
export class XrayGeneratorService {
    private readonly logger = new Logger(XrayGeneratorService.name);

    public async generateConfig(
        hosts: ResolvedProxyConfig[],
        isBase64: boolean,
        isExtendedClient: boolean,
    ): Promise<string> {
        try {
            const links = this.generateLinks(hosts, isExtendedClient);
            const joined = links.join('\n');
            return isBase64 ? Buffer.from(joined).toString('base64') : joined;
        } catch (error) {
            this.logger.error('Error generating xray config:', error);
            return '';
        }
    }

    public generateLinks(hosts: ResolvedProxyConfig[], isExtendedClient: boolean): string[] {
        const links: string[] = [];

        for (const host of hosts) {
            if (host.metadata.excludeFromSubscriptionTypes.includes('XRAY_BASE64')) continue;

            const shareLink = this.generateLink(host);
            if (!shareLink) continue;

            const link = this.serializeLink(this.applyBase64Mapper(shareLink, host));

            if (isExtendedClient && host.clientOverrides.serverDescription) {
                links.push(`${link}?serverDescription=${host.clientOverrides.serverDescription}`);
            } else {
                links.push(link);
            }
        }

        return links;
    }

    private generateLink(host: ResolvedProxyConfig): ShareLink | null {
        switch (host.protocol) {
            case 'vless':
                return this.buildVlessLink(host);
            case 'trojan':
                return this.buildTrojanLink(host);
            case 'shadowsocks':
                return this.buildShadowsocksLink(host);
            case 'hysteria':
                return this.buildHysteria2Link(host);
            default:
                return null;
        }
    }

    // ── VLESS ────────────────────────────────────────
    // vless://$(uuid)@host:port?params#remark

    private buildVlessLink(host: Extract<ResolvedProxyConfig, { protocol: 'vless' }>): ShareLink {
        const params: Record<string, unknown> = {};

        // Protocol fields (4.2)
        if (host.protocolOptions.encryption) {
            params.encryption = host.protocolOptions.encryption;
        }
        if (host.protocolOptions.flow) {
            params.flow = host.protocolOptions.flow;
        }

        // Transport (4.2.1 + 4.3)
        this.applyTransportParams(params, host);

        // Security (4.3.1 + 4.4)
        this.applySecurityParams(params, host);

        if (host.streamOverrides.finalMask) {
            params.fm = JSON.stringify(host.streamOverrides.finalMask);
        }

        return {
            scheme: 'vless',
            password: host.protocolOptions.id,
            address: host.address,
            port: host.port,
            remark: host.finalRemark,
            params,
        };
    }

    // ── Trojan ───────────────────────────────────────
    // trojan://$(password)@host:port?params#remark

    private buildTrojanLink(host: Extract<ResolvedProxyConfig, { protocol: 'trojan' }>): ShareLink {
        const params: Record<string, unknown> = {};

        // Transport (4.2.1 + 4.3)
        this.applyTransportParams(params, host);

        // Security (4.3.1 + 4.4)
        this.applySecurityParams(params, host);

        return {
            scheme: 'trojan',
            password: host.protocolOptions.password,
            address: host.address,
            port: host.port,
            remark: host.finalRemark,
            params,
        };
    }

    // ── Shadowsocks ──────────────────────────────────
    // ss://base64(method:password)@host:port#remark

    private buildShadowsocksLink(
        host: Extract<ResolvedProxyConfig, { protocol: 'shadowsocks' }>,
    ): ShareLink {
        return {
            scheme: 'ss',
            method: host.protocolOptions.method,
            password: host.protocolOptions.password,
            address: host.address,
            port: host.port,
            remark: host.finalRemark,
            params: {},
        };
    }

    // ── Hysteria 2 ───────────────────────────────────
    // hysteria2://auth@host:port/?params#remark

    private buildHysteria2Link(
        host: Extract<ResolvedProxyConfig, { protocol: 'hysteria' }>,
    ): null | ShareLink {
        if (host.transport !== 'hysteria') return null;

        const params: Record<string, unknown> = {};

        // Obfuscation
        const finalMask = host.streamOverrides.finalMask as Hysteria2FinalMask | null;
        const obfsPassword = finalMask?.udp?.find((m) => m?.type === 'salamander')?.settings
            ?.password;
        if (obfsPassword) {
            params.obfs = 'salamander';
            params['obfs-password'] = obfsPassword;
        }

        // TLS
        if (host.security === 'tls') {
            if (host.securityOptions.serverName) {
                params.sni = host.securityOptions.serverName;
            }
            if (host.securityOptions.pinnedPeerCertSha256) {
                params.pinSHA256 = host.securityOptions.pinnedPeerCertSha256;
            }
        }

        if (host.streamOverrides.finalMask) {
            params.fm = JSON.stringify(host.streamOverrides.finalMask);
        }

        return {
            scheme: 'hysteria2',
            password: host.transportOptions.auth,
            address: host.address,
            port: host.port,
            remark: host.finalRemark,
            params,
        };
    }

    // ── Transport Params ─────────────────────────────

    private applyTransportParams(params: Record<string, unknown>, host: ResolvedProxyConfig): void {
        // 4.2.1: type (transport)
        params.type = host.transport;

        switch (host.transport) {
            case 'tcp':
                this.applyTcpParams(params, host);
                break;
            case 'ws':
                this.applyWsParams(params, host);
                break;
            case 'httpupgrade':
                this.applyHttpUpgradeParams(params, host);
                break;
            case 'grpc':
                this.applyGrpcParams(params, host);
                break;
            case 'xhttp':
                this.applyXhttpParams(params, host);
                break;
            case 'kcp':
                this.applyKcpParams(params, host);
                break;
        }
    }

    private applyKcpParams(
        params: Record<string, unknown>,
        host: Extract<ResolvedProxyConfig, { transport: 'kcp' }>,
    ): void {
        if (host.transportOptions.clientMtu) {
            params.mtu = host.transportOptions.clientMtu;
        }
        if (host.transportOptions.clientTti) {
            params.tti = host.transportOptions.clientTti;
        }
    }

    // 4.3 TCP: headerType
    private applyTcpParams(
        params: Record<string, unknown>,
        host: Extract<ResolvedProxyConfig, { transport: 'tcp' }>,
    ): void {
        const header = host.transportOptions.header;
        if (!header) return;

        params.headerType = header.type;

        if (header.type !== 'http' || !header.request) return;

        params.path = header.request.path?.join(',') ?? '';
        params.host = header.request.headers?.Host?.join(',') ?? '';
    }

    // 4.3.4-5 WebSocket: path, host
    private applyWsParams(
        params: Record<string, unknown>,
        host: Extract<ResolvedProxyConfig, { transport: 'ws' }>,
    ): void {
        if (host.transportOptions.path) {
            params.path = host.transportOptions.path;
        }
        if (host.transportOptions.host) {
            params.host = host.transportOptions.host;
        }
        // Remnawave extension: heartbeatPeriod
        if (host.transportOptions.heartbeatPeriod) {
            params.heartbeatPeriod = host.transportOptions.heartbeatPeriod;
        }
    }

    // 4.3.14-15 HTTPUpgrade: path, host
    private applyHttpUpgradeParams(
        params: Record<string, unknown>,
        host: Extract<ResolvedProxyConfig, { transport: 'httpupgrade' }>,
    ): void {
        if (host.transportOptions.path) {
            params.path = host.transportOptions.path;
        }
        if (host.transportOptions.host) {
            params.host = host.transportOptions.host;
        }
    }

    // 4.3.11-13 gRPC: serviceName, mode, authority
    private applyGrpcParams(
        params: Record<string, unknown>,
        host: Extract<ResolvedProxyConfig, { transport: 'grpc' }>,
    ): void {
        if (host.transportOptions.serviceName) {
            params.serviceName = host.transportOptions.serviceName;
        }
        // 4.3.12: mode — gun (default) or multi
        params.mode = host.transportOptions.multiMode ? 'multi' : 'gun';

        if (host.transportOptions.authority) {
            params.authority = host.transportOptions.authority;
        }
    }

    // 4.3.16-19 XHTTP: path, host, mode, extra
    private applyXhttpParams(
        params: Record<string, unknown>,
        host: Extract<ResolvedProxyConfig, { transport: 'xhttp' }>,
    ): void {
        if (host.transportOptions.path) {
            params.path = host.transportOptions.path;
        }
        if (host.transportOptions.host) {
            params.host = host.transportOptions.host;
        }
        if (host.transportOptions.mode) {
            params.mode = host.transportOptions.mode;
        }
        // 4.3.19: extra — JSON
        if (host.transportOptions.extra) {
            params.extra = JSON.stringify(host.transportOptions.extra);
        }
    }

    // ── Security Params ──────────────────────────────

    private applySecurityParams(params: Record<string, unknown>, host: ResolvedProxyConfig): void {
        // 4.3.1: security
        params.security = host.security;

        switch (host.security) {
            case 'tls':
                this.applyTlsParams(params, host);
                break;
            case 'reality':
                this.applyRealityParams(params, host);
                break;
            case 'none':
                break;
        }
    }

    // 4.4 TLS: sni, fp, alpn, pcs
    private applyTlsParams(
        params: Record<string, unknown>,
        host: Extract<ResolvedProxyConfig, { security: 'tls' }>,
    ): void {
        const opts = host.securityOptions;

        // 4.4.1: sni
        if (opts.serverName !== null) {
            params.sni = opts.serverName;
        }

        // 4.4.0: fp (default chrome per spec)
        if (opts.fingerprint) {
            params.fp = opts.fingerprint;
        }

        // 4.4.2: alpn
        if (opts.alpn) {
            params.alpn = opts.alpn;
        }

        // 4.4.4: pcs (pinnedPeerCertSha256)
        if (opts.pinnedPeerCertSha256) {
            params.pcs = opts.pinnedPeerCertSha256;
        }

        // 4.4.4: vcn (verifyPeerCertByName)
        if (opts.verifyPeerCertByName) {
            params.vcn = opts.verifyPeerCertByName;
        }

        // https://github.com/XTLS/Xray-core/discussions/716#discussioncomment-17851670
        if (opts.cipherSuites) {
            params.cs = opts.cipherSuites;
        }
    }

    // 4.4 REALITY: sni, fp, pbk, sid, pqv, spx
    private applyRealityParams(
        params: Record<string, unknown>,
        host: Extract<ResolvedProxyConfig, { security: 'reality' }>,
    ): void {
        const opts = host.securityOptions;

        // 4.4.1: sni
        if (opts.serverName !== null) {
            params.sni = opts.serverName;
        }

        // 4.4.0: fp
        params.fp = opts.fingerprint || 'chrome';

        // 4.4.5: pbk (required for REALITY)
        if (opts.publicKey) {
            params.pbk = opts.publicKey;
        }

        // 4.4.6: sid
        if (opts.shortId) {
            params.sid = opts.shortId;
        }

        // 4.4.7: pqv (mldsa65Verify)
        if (opts.mldsa65Verify) {
            params.pqv = opts.mldsa65Verify;
        }

        // 4.4.8: spx (spiderX)
        if (opts.spiderX) {
            params.spx = opts.spiderX;
        }
    }

    private applyBase64Mapper(link: ShareLink, host: ResolvedProxyConfig): ShareLink {
        const operations = host.clientOverrides.mapper.base64;

        if (!operations || !operations.length) return link;

        const linkOperations: THostMapperOperation[] = [];
        const queryOperations: THostMapperOperation[] = [];

        for (const operation of operations) {
            if (!operation.to.startsWith(LINK_TARGET_PREFIX)) {
                queryOperations.push(operation);
                continue;
            }

            const target = operation.to.slice(LINK_TARGET_PREFIX.length);

            if (!LINK_ALLOWED_TARGETS.has(target)) continue;

            linkOperations.push({ ...operation, to: target });
        }

        const mapped = applyHostMapper(link, linkOperations, host, true);

        mapped.params = applyHostMapper(link.params, queryOperations, host, true);

        return this.sanitizeLink(mapped, link);
    }

    private sanitizeLink(mapped: ShareLink, original: ShareLink): ShareLink {
        const address = String(mapped.address ?? '').trim();
        const port = Number(mapped.port);
        const password = String(mapped.password ?? '');
        const method = mapped.method === undefined ? undefined : String(mapped.method);

        return {
            ...mapped,
            scheme: original.scheme,
            address: address || original.address,
            port: Number.isInteger(port) && port > 0 && port <= 65535 ? port : original.port,
            password: password || original.password,
            method: method || original.method,
            remark:
                mapped.remark === undefined || mapped.remark === null
                    ? original.remark
                    : String(mapped.remark),
        };
    }

    private serializeLink(link: ShareLink): string {
        const query = this.buildQueryString(link.params);
        const remark = encodeURIComponent(link.remark);
        const address = this.formatAddress(link.address);

        switch (link.scheme) {
            case 'ss': {
                const credentials = Buffer.from(`${link.method}:${link.password}`).toString(
                    'base64',
                );

                return `ss://${credentials}@${address}:${link.port}#${remark}`;
            }

            case 'hysteria2': {
                const queryPart = query ? `?${query}` : '';

                return `hysteria2://${encodeURIComponent(link.password)}@${address}:${link.port}/${queryPart}#${remark}`;
            }

            default:
                return `${link.scheme}://${encodeURIComponent(link.password)}@${address}:${link.port}?${query}#${remark}`;
        }
    }

    private formatAddress(address: string): string {
        if (!address.includes(':') || address.startsWith('[')) return address;

        return `[${address}]`;
    }

    private buildQueryString(params: Record<string, unknown>): string {
        const parts: string[] = [];

        for (const [key, value] of Object.entries(params)) {
            if (value === undefined || value === null) continue;
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }

        return parts.join('&');
    }
}
