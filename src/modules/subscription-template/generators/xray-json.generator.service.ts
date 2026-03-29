import type {
    TRemnawaveInjectorSelectFrom,
    TRemnawaveInjectorSelector,
} from '@libs/contracts/models';

import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyObject } from '@common/utils';

import {
    IGenerateConfigParams,
    Outbound,
    StreamSettings,
    XrayJsonConfig,
} from './interfaces/xray-json-config.interface';
import { SubscriptionTemplateService } from '../subscription-template.service';
import { ResolvedProxyConfig } from '../resolve-proxy/interfaces';

type VlessConfig = Extract<ResolvedProxyConfig, { protocol: 'vless' }>;
type TrojanConfig = Extract<ResolvedProxyConfig, { protocol: 'trojan' }>;
type ShadowsocksConfig = Extract<ResolvedProxyConfig, { protocol: 'shadowsocks' }>;
type HysteriaConfig = Extract<ResolvedProxyConfig, { protocol: 'hysteria' }>;

type ProtocolBuilderMap = {
    vless: (host: VlessConfig) => object;
    trojan: (host: TrojanConfig) => object;
    shadowsocks: (host: ShadowsocksConfig) => object;
    hysteria: (host: HysteriaConfig) => object;
};

type WsConfig = Extract<ResolvedProxyConfig, { transport: 'ws' }>;
type HttpUpgradeConfig = Extract<ResolvedProxyConfig, { transport: 'httpupgrade' }>;
type TcpConfig = Extract<ResolvedProxyConfig, { transport: 'tcp' }>;
type XHttpConfig = Extract<ResolvedProxyConfig, { transport: 'xhttp' }>;
type GrpcConfig = Extract<ResolvedProxyConfig, { transport: 'grpc' }>;
type KcpConfig = Extract<ResolvedProxyConfig, { transport: 'kcp' }>;
type HysteriaTransportConfig = Extract<ResolvedProxyConfig, { transport: 'hysteria' }>;

type TransportBuilderMap = {
    hysteria: (host: HysteriaTransportConfig) => Record<string, unknown>;
    ws: (host: WsConfig) => Record<string, unknown>;
    httpupgrade: (host: HttpUpgradeConfig) => Record<string, unknown>;
    tcp: (host: TcpConfig) => Record<string, unknown>;
    xhttp: (host: XHttpConfig) => Record<string, unknown>;
    grpc: (host: GrpcConfig) => Record<string, unknown>;
    kcp: (host: KcpConfig) => Record<string, unknown>;
};
const PROTOCOL_BUILDERS: ProtocolBuilderMap = {
    vless: (host) => ({
        vnext: [
            {
                address: host.address,
                port: host.port,
                users: [
                    {
                        id: host.protocolOptions.id,
                        encryption: host.protocolOptions.encryption || 'none',
                        flow: host.protocolOptions.flow,
                    },
                ],
            },
        ],
    }),

    trojan: (host) => ({
        servers: [
            {
                address: host.address,
                port: host.port,
                password: host.protocolOptions.password,
            },
        ],
    }),
    hysteria: (host) => ({
        address: host.address,
        port: host.port,
        version: 2,
    }),

    shadowsocks: (host) => ({
        servers: [
            {
                address: host.address,
                port: host.port,
                password: host.protocolOptions.password,
                method: host.protocolOptions.method,
                uot: host.protocolOptions.uot,
                UoTVersion: host.protocolOptions.uotVersion,
            },
        ],
    }),
};

const TRANSPORT_BUILDERS: TransportBuilderMap = {
    ws: (host) => ({
        path: host.transportOptions.path,
        headers: { Host: host.transportOptions.host, ...host.transportOptions.headers },
        ...(host.transportOptions.heartbeatPeriod != null && {
            heartbeatPeriod: host.transportOptions.heartbeatPeriod,
        }),
    }),
    httpupgrade: (host) => ({
        path: host.transportOptions.path,
        host: host.transportOptions.host,
        headers: { Host: host.transportOptions.host, ...host.transportOptions.headers },
    }),
    tcp: buildTcpSettings,
    xhttp: (host) => ({
        mode: host.transportOptions.mode,
        host: host.transportOptions.host,
        ...(host.transportOptions.path && { path: host.transportOptions.path }),
        ...(host.transportOptions.extra && { extra: host.transportOptions.extra }),
    }),
    grpc: (host) => ({
        serviceName: host.transportOptions.serviceName,
        authority: host.transportOptions.authority,
        mode: !!host.transportOptions.multiMode,
    }),
    kcp: (host) => ({
        mtu: host.transportOptions.clientMtu,
        tti: host.transportOptions.tti,
        congestion: host.transportOptions.congestion,
    }),
    hysteria: (host) => ({
        version: 2,
        auth: host.transportOptions.auth,
    }),
};

function buildTcpSettings(host: ResolvedProxyConfig): Record<string, unknown> {
    if (host.transport !== 'tcp' || !host.transportOptions.header) return {};

    return {
        header: host.transportOptions.header,
    };
}

function buildTlsSettings(host: ResolvedProxyConfig): Record<string, unknown> {
    if (host.security !== 'tls') return {};
    const settings: Record<string, unknown> = {
        serverName: host.securityOptions.serverName || '',
    };

    if (host.securityOptions.fingerprint !== '') {
        settings.fingerprint = host.securityOptions.fingerprint;
    }

    if (host.securityOptions.alpn) {
        settings.alpn = host.securityOptions.alpn.split(',');
    }

    if (host.securityOptions.allowInsecure) {
        settings.allowInsecure = true;
    }

    return settings;
}

function buildRealitySettings(host: ResolvedProxyConfig): Record<string, unknown> {
    if (host.security !== 'reality') return {};
    const settings: Record<string, unknown> = {
        serverName: host.securityOptions.serverName,
    };

    if (host.securityOptions.publicKey) settings.publicKey = host.securityOptions.publicKey;
    if (host.securityOptions.mldsa65Verify)
        settings.mldsa65Verify = host.securityOptions.mldsa65Verify;
    if (host.securityOptions.shortId) settings.shortId = host.securityOptions.shortId;
    if (host.securityOptions.spiderX) settings.spiderX = host.securityOptions.spiderX;
    if (host.securityOptions.fingerprint !== '')
        settings.fingerprint = host.securityOptions.fingerprint;

    return settings;
}

@Injectable()
export class XrayJsonGeneratorService {
    private readonly logger = new Logger(XrayJsonGeneratorService.name);

    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    public async generateConfig(params: IGenerateConfigParams): Promise<string> {
        const {
            hosts,
            isExtendedClient,
            overrideTemplateName,
            ignoreHostXrayJsonTemplate = false,
        } = params;

        try {
            const templateContent = (await this.subscriptionTemplateService.getCachedTemplateByType(
                'XRAY_JSON',
                overrideTemplateName,
            )) as unknown as XrayJsonConfig;

            const configs: XrayJsonConfig[] = [];

            for (const host of hosts) {
                if (host.metadata.isHidden) continue;
                if (host.metadata.excludeFromSubscriptionTypes.includes('XRAY_JSON')) continue;

                const baseTemplate = ignoreHostXrayJsonTemplate
                    ? templateContent
                    : ((host.clientOverrides.xrayJsonTemplate as XrayJsonConfig) ??
                      templateContent);

                if (baseTemplate.remnawave) {
                    const injected = this.applyRemnawaveInjector(
                        baseTemplate,
                        host,
                        hosts,
                        isExtendedClient,
                    );
                    if (injected) configs.push(injected);
                    continue;
                }

                const outboundConfig = this.buildOutboundConfig(host, isExtendedClient);
                if (!outboundConfig) continue;

                configs.push({
                    ...baseTemplate,
                    outbounds: [...outboundConfig.outbounds, ...baseTemplate.outbounds],
                    remarks: outboundConfig.remarks,
                    meta: outboundConfig.meta,
                });
            }

            return JSON.stringify(configs, null, 0);
        } catch (error) {
            this.logger.error(`Error generating xray-json config: ${error}`);
            return '';
        }
    }

    private buildOutboundConfig(
        host: ResolvedProxyConfig,
        isExtendedClient: boolean,
        tag = 'proxy',
    ): XrayJsonConfig | null {
        try {
            const outbound = this.buildOutbound(host, tag);

            const config: XrayJsonConfig = {
                remarks: host.finalRemark,
                outbounds: [outbound],
            };

            if (isExtendedClient && host.clientOverrides.serverDescription) {
                config.meta = {
                    serverDescription: Buffer.from(
                        host.clientOverrides.serverDescription,
                        'base64',
                    ).toString(),
                };
            }

            return config;
        } catch (error) {
            this.logger.error(`Error creating config for host: ${error}`);
            return null;
        }
    }

    private buildOutbound(host: ResolvedProxyConfig, tag: string): Outbound {
        const outbound: Outbound = {
            tag,
            protocol: host.protocol,
            settings: this.buildProtocolSettings(host),
            streamSettings: this.buildStreamSettings(host),
        };

        if (isNonEmptyObject(host.mux)) {
            outbound.mux = host.mux;
        }

        return outbound;
    }

    private buildTransportEntry(host: ResolvedProxyConfig): object {
        switch (host.transport) {
            case 'ws':
                return { wsSettings: TRANSPORT_BUILDERS.ws(host) };
            case 'httpupgrade':
                return { httpupgradeSettings: TRANSPORT_BUILDERS.httpupgrade(host) };
            case 'tcp':
                return { tcpSettings: TRANSPORT_BUILDERS.tcp(host) };
            case 'xhttp':
                return { xhttpSettings: TRANSPORT_BUILDERS.xhttp(host) };
            case 'grpc':
                return { grpcSettings: TRANSPORT_BUILDERS.grpc(host) };
            case 'kcp':
                return { kcpSettings: TRANSPORT_BUILDERS.kcp(host) };
            case 'hysteria':
                return { hysteriaSettings: TRANSPORT_BUILDERS.hysteria(host) };
        }
    }

    private buildProtocolSettings(host: ResolvedProxyConfig): object {
        switch (host.protocol) {
            case 'vless':
                return PROTOCOL_BUILDERS.vless(host);
            case 'trojan':
                return PROTOCOL_BUILDERS.trojan(host);
            case 'shadowsocks':
                return PROTOCOL_BUILDERS.shadowsocks(host);
            case 'hysteria':
                return PROTOCOL_BUILDERS.hysteria(host);
        }
    }

    private buildSecurityEntry(host: ResolvedProxyConfig): object {
        switch (host.security) {
            case 'tls':
                return {
                    security: 'tls',
                    tlsSettings: buildTlsSettings(host),
                };
            case 'reality':
                return {
                    security: 'reality',
                    realitySettings: buildRealitySettings(host),
                };
            case 'none':
                return { security: 'none' };
            default:
                return {};
        }
    }

    private buildStreamSettings(host: ResolvedProxyConfig): StreamSettings {
        return {
            network: host.transport,
            ...this.buildTransportEntry(host),
            ...this.buildSecurityEntry(host),
            ...(host.streamOverrides.sockopt && { sockopt: host.streamOverrides.sockopt }),
            ...(host.streamOverrides.finalMask && { finalmask: host.streamOverrides.finalMask }),
        };
    }

    private buildTaggedOutbounds(
        hosts: ResolvedProxyConfig[],
        {
            tagPrefix,
            useHostRemarkAsTag,
            useHostTagAsTag,
        }: { tagPrefix?: string; useHostRemarkAsTag?: boolean; useHostTagAsTag?: boolean },
    ): Outbound[] {
        if (useHostRemarkAsTag) {
            return hosts.map((h) => this.buildOutbound(h, h.finalRemark));
        }

        if (useHostTagAsTag) {
            return hosts.map((h) => this.buildOutbound(h, h.metadata.tag || h.finalRemark));
        }

        const proxyTag = tagPrefix ?? 'proxy';
        return hosts.map((h, i) =>
            this.buildOutbound(h, i === 0 ? proxyTag : `${proxyTag}-${i + 1}`),
        );
    }

    private parseRegex(pattern: string): RegExp | null {
        try {
            return new RegExp(pattern);
        } catch {
            this.logger.error(`Invalid regex pattern for injectHosts entry: ${pattern}`);
            return null;
        }
    }

    private resolveHosts(
        selector: TRemnawaveInjectorSelector,
        selectFrom: TRemnawaveInjectorSelectFrom,
        host: ResolvedProxyConfig,
        allHosts: ResolvedProxyConfig[],
    ): ResolvedProxyConfig[] {
        const source = selectFrom ?? 'HIDDEN';
        let candidates: ResolvedProxyConfig[] = [];
        switch (source) {
            case 'ALL':
                candidates = allHosts;
                break;
            case 'HIDDEN':
                candidates = allHosts.filter((h) => h.metadata.isHidden);
                break;
            case 'NOT_HIDDEN':
                candidates = allHosts.filter((h) => !h.metadata.isHidden);
                break;
        }

        switch (selector.type) {
            case 'uuids':
                return selector.values
                    .map((uuid) => candidates.find((h) => h.metadata.uuid === uuid))
                    .filter(Boolean) as ResolvedProxyConfig[];

            case 'remarkRegex': {
                const regex = this.parseRegex(selector.pattern);
                if (!regex) return [];
                return candidates.filter((h) => regex.test(h.finalRemark));
            }

            case 'sameTagAsRecipient':
                return candidates.filter(
                    (h) =>
                        h.metadata.tag && host.metadata.tag && h.metadata.tag === host.metadata.tag,
                );

            case 'tagRegex': {
                const regex = this.parseRegex(selector.pattern);
                if (!regex) return [];
                return candidates.filter((h) => h.metadata.tag && regex.test(h.metadata.tag));
            }
        }
    }

    private applyRemnawaveInjector(
        baseTemplate: XrayJsonConfig,
        host: ResolvedProxyConfig,
        allHosts: ResolvedProxyConfig[],
        isExtendedClient: boolean,
    ): XrayJsonConfig | null {
        const { remnawave: injector, ...template } = baseTemplate;
        if (!injector) return null;
        if (!injector.injectHosts && !injector.addVirtualHostAsOutbound) return null;

        const injectedOutbounds = [
            ...(injector.addVirtualHostAsOutbound ? [this.buildOutbound(host, 'proxy')] : []),
            ...(injector.injectHosts ?? []).flatMap((entry) => {
                return this.buildTaggedOutbounds(
                    this.resolveHosts(entry.selector, entry.selectFrom, host, allHosts),
                    {
                        tagPrefix: entry.tagPrefix,
                        useHostRemarkAsTag: entry.useHostRemarkAsTag,
                        useHostTagAsTag: entry.useHostTagAsTag,
                    },
                );
            }),
        ];

        const config: XrayJsonConfig = {
            ...template,
            outbounds: [...injectedOutbounds, ...template.outbounds],
            remarks: host.finalRemark,
        };

        if (isExtendedClient && host.clientOverrides.serverDescription) {
            config.meta = {
                serverDescription: Buffer.from(
                    host.clientOverrides.serverDescription,
                    'base64',
                ).toString(),
            };
        }

        return config;
    }
}
