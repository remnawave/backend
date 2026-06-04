import { isIP } from 'node:net';

import { Injectable, Logger } from '@nestjs/common';

import { SubscriptionTemplateService } from '@modules/subscription-template/subscription-template.service';

import { ResolvedProxyConfig } from '../resolve-proxy/interfaces';

const PROXIES_MARKER = '#!remnawave-proxies';
const PROXY_NAMES_MARKER = '#!remnawave-proxy-names';
const UNSUPPORTED_PROTOCOLS = new Set(['vless']);
const UNSUPPORTED_TRANSPORTS = new Set(['grpc', 'httpupgrade', 'kcp', 'xhttp']);

@Injectable()
export class SurgeGeneratorService {
    private readonly logger = new Logger(SurgeGeneratorService.name);

    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    public async generateConfig(
        hosts: ResolvedProxyConfig[],
        overrideTemplateName?: string,
    ): Promise<string> {
        try {
            const template = await this.subscriptionTemplateService.getCachedTemplateByType(
                'SURGE',
                overrideTemplateName,
            );

            if (typeof template !== 'string') {
                throw new Error('Surge template must be stored as plain text');
            }

            const proxyLines: string[] = [];
            const proxyNames: string[] = [];
            const alwaysRealIpDomains = new Set<string>();

            for (const host of hosts) {
                if (host.metadata.excludeFromSubscriptionTypes.includes('SURGE')) continue;
                if (host.metadata.isHidden) continue;
                if (UNSUPPORTED_PROTOCOLS.has(host.protocol)) continue;
                if (UNSUPPORTED_TRANSPORTS.has(host.transport)) continue;

                const proxyLine = this.buildProxyLine(host);
                if (!proxyLine) continue;

                proxyLines.push(proxyLine);
                proxyNames.push(host.finalRemark);

                const realIpDomain = this.getAlwaysRealIpDomain(host.address);
                if (realIpDomain) {
                    alwaysRealIpDomains.add(realIpDomain);
                }
            }

            return this.renderTemplate(template, proxyLines, proxyNames, [...alwaysRealIpDomains]);
        } catch (error) {
            this.logger.error('Error generating Surge config:', error);
            return '';
        }
    }

    private buildProxyLine(host: ResolvedProxyConfig): string | null {
        if (host.security === 'reality') {
            return null;
        }

        switch (host.protocol) {
            case 'trojan':
                return this.buildTrojanProxy(host);
            case 'shadowsocks':
                return this.buildShadowsocksProxy(host);
            case 'hysteria':
                return this.buildHysteriaProxy(host);
            default:
                return null;
        }
    }

    private buildTrojanProxy(
        host: Extract<ResolvedProxyConfig, { protocol: 'trojan' }>,
    ): string | null {
        const params: Record<string, string | boolean> = {
            password: host.protocolOptions.password,
            'udp-relay': true,
        };

        if (host.transport === 'ws') {
            params.ws = true;

            const path = host.transportOptions.path;
            const wsHost = host.transportOptions.host;

            if (path) {
                params['ws-path'] = this.stripEarlyData(path);
            }

            if (wsHost) {
                params['ws-headers'] = `Host:${wsHost}`;
            }
        } else if (host.transport !== 'tcp') {
            return null;
        }

        this.applyTlsParams(host, params);

        return this.formatProxyLine(host.finalRemark, 'trojan', host.address, host.port, params);
    }

    private buildShadowsocksProxy(
        host: Extract<ResolvedProxyConfig, { protocol: 'shadowsocks' }>,
    ): string | null {
        if (host.transport !== 'tcp' || host.security !== 'none') {
            return null;
        }

        return this.formatProxyLine(host.finalRemark, 'ss', host.address, host.port, {
            'encrypt-method': host.protocolOptions.method,
            password: host.protocolOptions.password,
            'udp-relay': true,
        });
    }

    private buildHysteriaProxy(
        host: Extract<ResolvedProxyConfig, { protocol: 'hysteria' }>,
    ): string | null {
        if (host.transport !== 'hysteria') {
            return null;
        }

        const params: Record<string, string | boolean> = {
            password: host.transportOptions.auth,
        };

        this.applyTlsParams(host, params);

        return this.formatProxyLine(host.finalRemark, 'hysteria2', host.address, host.port, params);
    }

    private applyTlsParams(
        host: ResolvedProxyConfig,
        params: Record<string, string | boolean>,
    ): void {
        if (host.security !== 'tls') {
            return;
        }

        if (host.securityOptions.allowInsecure) {
            params['skip-cert-verify'] = true;
        }

        if (host.securityOptions.serverName) {
            params.sni = host.securityOptions.serverName;
        }
    }

    private stripEarlyData(path: string): string {
        if (!path.includes('?ed=')) {
            return path;
        }

        return path.split('?ed=')[0];
    }

    private formatProxyLine(
        name: string,
        type: string,
        address: string,
        port: number,
        params: Record<string, string | boolean>,
    ): string {
        const serializedParams = Object.entries(params).map(
            ([key, value]) => `${key}=${this.formatValue(value)}`,
        );

        return `${name} = ${type}, ${address}, ${port}, ${serializedParams.join(', ')}`;
    }

    private formatValue(value: string | boolean): string {
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }

        if (value.includes(',') || value.includes(';')) {
            return `"${value.replace(/"/g, '\\"')}"`;
        }

        return value;
    }

    private renderTemplate(
        template: string,
        proxyLines: string[],
        proxyNames: string[],
        alwaysRealIpDomains: string[],
    ): string {
        const proxyText = proxyLines.join('\n');
        const groupText = proxyNames.length > 0 ? `${proxyNames.join(', ')}, DIRECT` : 'DIRECT';

        let rendered = template.includes(PROXIES_MARKER)
            ? template.split(PROXIES_MARKER).join(proxyText)
            : this.insertIntoProxySection(template, proxyText);

        rendered = rendered.split(PROXY_NAMES_MARKER).join(groupText);
        rendered = this.applyAlwaysRealIp(rendered, alwaysRealIpDomains);

        return `${rendered.trimEnd()}\n`;
    }

    private getAlwaysRealIpDomain(address: string): string | null {
        const host = address.trim().replace(/^\[(.*)]$/, '$1');

        if (!host || isIP(host)) {
            return null;
        }

        return host;
    }

    private applyAlwaysRealIp(config: string, domains: string[]): string {
        if (domains.length === 0) {
            return config;
        }

        const uniqueDomains = [...new Set(domains)];
        const alwaysRealIpPattern = /^always-real-ip\s*=\s*(.*)$/im;

        if (alwaysRealIpPattern.test(config)) {
            return config.replace(alwaysRealIpPattern, (_line, existing: string) => {
                const entries = existing
                    .split(',')
                    .map((entry) => entry.trim())
                    .filter(Boolean);

                for (const domain of uniqueDomains) {
                    if (!entries.includes(domain)) {
                        entries.push(domain);
                    }
                }

                return `always-real-ip = ${entries.join(', ')}`;
            });
        }

        const alwaysRealIpLine = `always-real-ip = ${uniqueDomains.join(', ')}\n`;
        const generalSectionPattern = /\[General]\s*\n/i;

        if (generalSectionPattern.test(config)) {
            return config.replace(generalSectionPattern, (match) => `${match}${alwaysRealIpLine}`);
        }

        return `[General]\n${alwaysRealIpLine}\n${config}`;
    }

    private insertIntoProxySection(template: string, proxyText: string): string {
        if (!proxyText) {
            return template;
        }

        const proxySection = /\[Proxy\]\s*\n/i;
        if (proxySection.test(template)) {
            return template.replace(proxySection, (match) => `${match}${proxyText}\n`);
        }

        return `${template.trimEnd()}\n\n[Proxy]\n${proxyText}\n`;
    }
}
