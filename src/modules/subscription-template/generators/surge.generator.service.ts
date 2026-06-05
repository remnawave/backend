import { Injectable, Logger } from '@nestjs/common';

import { fromNano } from '@common/utils/nano';

import { ResolvedProxyConfig } from '../resolve-proxy/interfaces';

const DEFAULT_GROUP = '🚀 节点选择';
const UNSUPPORTED_TRANSPORTS = new Set(['grpc', 'hysteria', 'kcp', 'xhttp']);
const UNSUPPORTED_PROTOCOLS = new Set(['hysteria', 'vless']);

@Injectable()
export class SurgeGeneratorService {
    private readonly logger = new Logger(SurgeGeneratorService.name);

    public async generateConfig(hosts: ResolvedProxyConfig[]): Promise<string> {
        try {
            const proxies: string[] = [];
            const proxyNames: string[] = [];

            for (const host of hosts) {
                if (host.metadata.isHidden) continue;
                if (host.metadata.excludeFromSubscriptionTypes.includes('SURGE')) continue;
                if (UNSUPPORTED_TRANSPORTS.has(host.transport)) continue;
                if (UNSUPPORTED_PROTOCOLS.has(host.protocol)) continue;

                const proxy = this.buildProxy(host);
                if (!proxy) continue;

                proxies.push(proxy.line);
                proxyNames.push(proxy.name);
            }

            if (proxies.length === 0) return '';

            return [
                '#!MANAGED-CONFIG https://remnawave.app interval=43200 strict=true',
                '',
                '[General]',
                'loglevel = notify',
                'dns-server = system',
                '',
                '[Proxy]',
                ...proxies,
                '',
                '[Proxy Group]',
                `${DEFAULT_GROUP} = select, ${proxyNames.join(', ')}, DIRECT`,
                '',
                '[Rule]',
                `FINAL,${DEFAULT_GROUP}`,
                '',
            ].join('\n');
        } catch (error) {
            this.logger.error('Error generating Surge config:', error);
            return '';
        }
    }

    private buildProxy(host: ResolvedProxyConfig): null | { line: string; name: string } {
        const name = this.sanitizeName(this.formatName(host));

        switch (host.protocol) {
            case 'trojan':
                return {
                    name,
                    line: this.buildLine(name, 'trojan', host, [
                        ['password', host.protocolOptions.password],
                    ]),
                };

            case 'shadowsocks':
                return {
                    name,
                    line: this.buildLine(name, 'ss', host, [
                        ['encrypt-method', host.protocolOptions.method],
                        ['password', host.protocolOptions.password],
                    ]),
                };

            default:
                return null;
        }
    }

    private buildLine(
        name: string,
        type: string,
        host: ResolvedProxyConfig,
        baseParams: Array<[string, string | boolean | number | null | undefined]>,
    ): string {
        const params: Array<[string, string | boolean | number | null | undefined]> = [
            ...baseParams,
            ['udp-relay', true],
            ['tfo', true],
        ];

        this.applySecurityParams(params, host);
        this.applyTransportParams(params, host);

        return [
            `${name} = ${type}`,
            this.escapeValue(host.address),
            host.port.toString(),
            ...params
                .filter(([, value]) => value !== null && value !== undefined && value !== '')
                .map(([key, value]) => `${key}=${this.escapeValue(String(value))}`),
        ].join(', ');
    }

    private applySecurityParams(
        params: Array<[string, string | boolean | number | null | undefined]>,
        host: ResolvedProxyConfig,
    ): void {
        switch (host.security) {
            case 'tls':
                params.push(['tls', true]);
                params.push(['sni', host.securityOptions.serverName]);
                params.push(['skip-cert-verify', host.securityOptions.allowInsecure]);
                break;
            case 'none':
                break;
            case 'reality':
                break;
        }
    }

    private applyTransportParams(
        params: Array<[string, string | boolean | number | null | undefined]>,
        host: ResolvedProxyConfig,
    ): void {
        switch (host.transport) {
            case 'ws':
                params.push(['ws', true]);
                params.push(['ws-path', host.transportOptions.path]);
                params.push(['ws-headers', this.buildWsHeaders(host.transportOptions.host)]);
                break;

            case 'httpupgrade':
                params.push(['ws', true]);
                params.push(['ws-path', host.transportOptions.path]);
                params.push(['ws-headers', this.buildWsHeaders(host.transportOptions.host)]);
                break;

            case 'tcp':
                break;

            default:
                break;
        }
    }

    private buildWsHeaders(host: string | null): string | null {
        return host ? `Host:${host}` : null;
    }

    private formatName(host: ResolvedProxyConfig): string {
        const multiplier = fromNano(host.metadata.consumptionMultiplier ?? 1000000000n);

        return host.finalRemark.replace(/\{\{NODE_MULTIPLIER\}\}/g, multiplier);
    }

    private sanitizeName(name: string): string {
        return (
            name
                .replace(/[\r\n=,]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim() || 'Proxy'
        );
    }

    private escapeValue(value: string): string {
        return value.replace(/[\r\n]/g, '');
    }
}
