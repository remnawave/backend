import yaml from 'yaml';
import _ from 'lodash';

import { Injectable, Logger } from '@nestjs/common';

import { SubscriptionTemplateService } from '@modules/subscription-template/subscription-template.service';

import { ResolvedProxyConfig } from '../resolve-proxy/interfaces';

interface NetworkConfig {
    'early-data-header-name'?: string;
    'grpc-service-name'?: string;
    headers?: Record<string, string>;
    Host?: string;
    host?: string[];
    'max-early-data'?: number;
    path?: string | string[];
    smux?: { [key: string]: unknown; enabled: boolean };
    'v2ray-http-upgrade'?: boolean;
    'v2ray-http-upgrade-fast-open'?: boolean;
}

interface ProxyNode {
    [key: string]: unknown;
    alpn?: string[];
    alterId?: number;
    cipher?: string;
    name: string;
    network: string;
    password?: string;
    port: number;
    server: string;
    servername?: string;
    'skip-cert-verify'?: boolean;
    sni?: string;
    tls?: boolean;
    type: string;
    udp: boolean;
    uuid?: string;
}

interface ClashData {
    proxies: ProxyNode[];
    rules: string[];
}

const UNSUPPORTED_TRANSPORTS = new Set(['hysteria', 'kcp', 'xhttp']);
const UNSUPPORTED_PROTOCOLS = new Set(['hysteria', 'vless']);
@Injectable()
export class ClashGeneratorService {
    private readonly logger = new Logger(ClashGeneratorService.name);

    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    public async generateConfig(
        hosts: ResolvedProxyConfig[],
        overrideTemplateName?: string,
    ): Promise<string> {
        try {
            const data: ClashData = { proxies: [], rules: [] };
            const proxyRemarks: string[] = [];

            for (const host of hosts) {
                if (host.metadata.excludeFromSubscriptionTypes.includes('CLASH')) continue;
                if (UNSUPPORTED_TRANSPORTS.has(host.transport)) continue;
                if (UNSUPPORTED_PROTOCOLS.has(host.protocol)) continue;

                const node = this.buildProxyNode(host);
                if (!node) continue;

                data.proxies.push(node);
                proxyRemarks.push(host.finalRemark);
            }

            return await this.renderConfig(data, proxyRemarks, overrideTemplateName);
        } catch (error) {
            this.logger.error('Error generating clash config:', error);
            return '';
        }
    }

    private buildProxyNode(host: ResolvedProxyConfig): ProxyNode | null {
        const node: ProxyNode = {
            name: host.finalRemark,
            type: this.resolveClashType(host.protocol),
            server: host.address,
            port: host.port,
            network: this.resolveClashNetwork(host),
            udp: true,
        };

        if (!this.applyProtocolFields(node, host)) {
            return null;
        }

        this.applySecurityFields(node, host);

        const netOpts = this.buildNetworkOpts(host);
        if (Object.keys(netOpts).length > 0) {
            node[`${node.network}-opts`] = netOpts;
        }

        node['client-fingerprint'] = this.resolveFingerprint(host);

        return node;
    }

    private resolveClashType(protocol: string): string {
        return protocol === 'shadowsocks' ? 'ss' : protocol;
    }

    private applyProtocolFields(node: ProxyNode, host: ResolvedProxyConfig): boolean {
        switch (host.protocol) {
            case 'trojan':
                node.password = host.protocolOptions.password;
                return true;

            case 'shadowsocks':
                node.password = host.protocolOptions.password;
                node.cipher = host.protocolOptions.method;
                return true;

            default:
                return false;
        }
    }

    private applySecurityFields(node: ProxyNode, host: ResolvedProxyConfig): void {
        switch (host.security) {
            case 'tls': {
                const opts = host.securityOptions;
                node.tls = true;

                if (node.type === 'trojan') {
                    node.sni = opts.serverName ?? '';
                } else {
                    node.servername = opts.serverName ?? '';
                }

                if (opts.alpn) {
                    node.alpn = opts.alpn.split(',');
                }

                if (opts.allowInsecure) {
                    node['skip-cert-verify'] = true;
                }
                break;
            }
            case 'none':
                break;
            default:
                break;
        }
    }

    private resolveFingerprint(host: ResolvedProxyConfig): string {
        switch (host.security) {
            case 'tls':
                return host.securityOptions.fingerprint ?? 'chrome';
            default:
                return 'chrome';
        }
    }

    private resolveClashNetwork(host: ResolvedProxyConfig): string {
        const transport = host.transport;

        if (transport === 'tcp' && host.transportOptions.header?.type === 'http') {
            return 'http';
        }

        if (transport === 'httpupgrade') {
            return 'ws';
        }

        return transport;
    }

    private buildNetworkOpts(host: ResolvedProxyConfig): NetworkConfig {
        switch (host.transport) {
            case 'ws':
                return this.buildWsOpts(host.transportOptions.path, host.transportOptions.host);

            case 'httpupgrade':
                return this.buildWsOpts(
                    host.transportOptions.path,
                    host.transportOptions.host,
                    true,
                );

            case 'tcp':
                return this.buildTcpOpts(host);

            case 'grpc':
                return this.buildGrpcOpts(host.transportOptions.serviceName);

            default:
                return {};
        }
    }

    private buildWsOpts(
        rawPath: string | null,
        host: string | null,
        isHttpUpgrade = false,
    ): NetworkConfig {
        const config: NetworkConfig = {};

        let path = rawPath ?? '';
        let maxEarlyData: number | undefined;
        let earlyDataHeaderName = '';

        // Parse ?ed= from path
        if (path.includes('?ed=')) {
            const [pathPart, edPart] = path.split('?ed=');
            path = pathPart;
            const parsed = parseInt(edPart.split('/')[0]);
            maxEarlyData = isNaN(parsed) ? undefined : parsed;
            earlyDataHeaderName = 'Sec-WebSocket-Protocol';
        }

        if (path) {
            config.path = path;
        }

        config.headers = host ? { Host: host } : {};

        if (maxEarlyData !== undefined) {
            config['max-early-data'] = maxEarlyData;
        }

        if (earlyDataHeaderName) {
            config['early-data-header-name'] = earlyDataHeaderName;
        }

        if (isHttpUpgrade) {
            config['v2ray-http-upgrade'] = true;
            config['v2ray-http-upgrade-fast-open'] = true;
        }

        return config;
    }

    private buildTcpOpts(host: Extract<ResolvedProxyConfig, { transport: 'tcp' }>): NetworkConfig {
        // TCP with no header or 'none' header — no opts needed
        if (!host.transportOptions.header || host.transportOptions.header.type === 'none') {
            return {};
        }

        // HTTP camouflage is handled by clash network = 'http', no extra opts typically needed
        return {};
    }

    private buildGrpcOpts(serviceName: string | null): NetworkConfig {
        return {
            'grpc-service-name': serviceName ?? '',
        };
    }

    // ── Template Rendering ───────────────────────────

    private async renderConfig(
        data: ClashData,
        proxyRemarks: string[],
        overrideTemplateName?: string,
    ): Promise<string> {
        const yamlConfig = (await this.subscriptionTemplateService.getCachedTemplateByType(
            'CLASH',
            overrideTemplateName,
        )) as Record<string, unknown>;

        try {
            if (!Array.isArray(yamlConfig.proxies)) {
                yamlConfig.proxies = [];
            }

            if (!Array.isArray(yamlConfig['proxy-groups'])) {
                yamlConfig['proxy-groups'] = [];
            }

            (yamlConfig.proxies as ProxyNode[]).push(...data.proxies);

            for (const group of yamlConfig['proxy-groups'] as Record<string, unknown>[]) {
                if (!Array.isArray(group.proxies)) {
                    group.proxies = [];
                }

                const remarks = this.resolveGroupRemarks(group, proxyRemarks);

                (group.proxies as string[]).push(...remarks);
            }

            return yaml.stringify(yamlConfig);
        } catch (error) {
            this.logger.error('Error rendering yaml config:', error);
            return '';
        }
    }

    private resolveGroupRemarks(group: Record<string, unknown>, proxyRemarks: string[]): string[] {
        const remnawaveCustom = group.remnawave as Record<string, unknown> | undefined;

        if (remnawaveCustom) {
            delete group.remnawave;
        }

        if (remnawaveCustom?.['include-proxies'] === false) {
            return [];
        }

        if (remnawaveCustom?.['select-random-proxy'] === true) {
            const random = proxyRemarks[Math.floor(Math.random() * proxyRemarks.length)];
            return random ? [random] : [];
        }

        if (remnawaveCustom?.['shuffle-proxies-order'] === true) {
            return _.shuffle(proxyRemarks);
        }

        return [...proxyRemarks];
    }
}
