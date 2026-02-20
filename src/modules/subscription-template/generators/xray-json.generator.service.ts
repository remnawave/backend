import { Injectable, Logger } from '@nestjs/common';

import {
    IGenerateConfigParams,
    Outbound,
    OutboundSettings,
    StreamSettings,
    XrayJsonConfig,
} from './interfaces/xray-json-config.interface';
import { SubscriptionTemplateService } from '../subscription-template.service';
import { IFormattedHost } from './interfaces/formatted-hosts.interface';

type ProtocolBuilder = (host: IFormattedHost) => OutboundSettings;
type TransportBuilder = (host: IFormattedHost) => Record<string, unknown>;

const PROTOCOL_BUILDERS: Record<string, ProtocolBuilder> = {
    vless: (host) => ({
        vnext: [
            {
                address: host.address,
                port: host.port,
                users: [
                    {
                        id: host.password.vlessPassword,
                        encryption: host.encryption || 'none',
                        flow: host.flow,
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
                password: host.password.trojanPassword,
            },
        ],
    }),

    shadowsocks: (host) => ({
        servers: [
            {
                address: host.address,
                port: host.port,
                password: host.password.ssPassword,
                method: 'chacha20-ietf-poly1305',
                uot: false,
                ivCheck: false,
            },
        ],
    }),
};

const TRANSPORT_KEY_MAP: Record<string, keyof StreamSettings> = {
    ws: 'wsSettings',
    httpupgrade: 'httpupgradeSettings',
    tcp: 'tcpSettings',
    raw: 'tcpSettings',
    xhttp: 'xhttpSettings',
    grpc: 'grpcSettings',
};

const TRANSPORT_BUILDERS: Record<string, TransportBuilder> = {
    ws: (host) => ({
        path: host.path,
        headers: { Host: host.host },
        ...(host.additionalParams?.heartbeatPeriod != null && {
            heartbeatPeriod: host.additionalParams.heartbeatPeriod,
        }),
    }),

    httpupgrade: (host) => ({
        path: host.path,
        host: host.host,
    }),

    tcp: buildTcpSettings,
    raw: buildTcpSettings,

    xhttp: (host) => {
        const settings: Record<string, unknown> = {
            mode: host.additionalParams?.mode || 'auto',
            host: host.host,
        };

        if (host.path !== '') {
            settings.path = host.path;
        }

        if (isNonEmptyObject(host.xHttpExtraParams)) {
            settings.extra = host.xHttpExtraParams;
        }

        return settings;
    },

    grpc: (host) => ({
        serviceName: host.path,
        authority: host.host,
        mode: !!host.additionalParams?.grpcMultiMode,
    }),
};

function buildTcpSettings(host: IFormattedHost): Record<string, unknown> {
    if (host.rawSettings?.headerType !== 'http') {
        return {};
    }

    const baseRequest = host.rawSettings.request
        ? (structuredClone(host.rawSettings.request) as Record<string, any>)
        : {
              version: '1.1',
              method: 'GET',
              headers: {
                  'Accept-Encoding': ['gzip', 'deflate'],
                  Connection: ['keep-alive'],
                  Pragma: 'no-cache',
              },
          };

    if (host.path) {
        baseRequest.path = [host.path];
    }

    baseRequest.headers = baseRequest.headers || {};
    baseRequest.headers.Host = [host.host];

    return {
        header: {
            type: 'http',
            request: baseRequest,
        },
    };
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
    return value != null && typeof value === 'object' && Object.keys(value).length > 0;
}

function buildTlsSettings(host: IFormattedHost): Record<string, unknown> {
    const settings: Record<string, unknown> = {
        serverName: host.sni || '',
        allowInsecure: host.allowInsecure || false,
        show: false,
    };

    if (host.fingerprint !== '') {
        settings.fingerprint = host.fingerprint;
    }

    if (host.alpn) {
        settings.alpn = host.alpn.split(',');
    }

    return settings;
}

function buildRealitySettings(host: IFormattedHost): Record<string, unknown> {
    const settings: Record<string, unknown> = {
        serverName: host.sni,
        show: false,
    };

    if (host.publicKey) settings.publicKey = host.publicKey;
    if (host.mldsa65Verify) settings.mldsa65Verify = host.mldsa65Verify;
    if (host.shortId) settings.shortId = host.shortId;
    if (host.spiderX) settings.spiderX = host.spiderX;
    if (host.fingerprint !== '') settings.fingerprint = host.fingerprint;

    return settings;
}

@Injectable()
export class XrayJsonGeneratorService {
    private readonly logger = new Logger(XrayJsonGeneratorService.name);

    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    public async generateConfig(params: IGenerateConfigParams): Promise<string> {
        const { hosts, isHapp, overrideTemplateName, ignoreHostXrayJsonTemplate = false } = params;

        try {
            const templateContent = (await this.subscriptionTemplateService.getCachedTemplateByType(
                'XRAY_JSON',
                overrideTemplateName,
            )) as unknown as XrayJsonConfig;

            const configs: XrayJsonConfig[] = [];

            for (const host of hosts) {
                if (host.serviceInfo.isHidden) continue;

                const baseTemplate = ignoreHostXrayJsonTemplate
                    ? templateContent
                    : ((host.xrayJsonTemplate as XrayJsonConfig) ?? templateContent);

                if (baseTemplate.remnawave) {
                    const injected = this.applyRemnawaveInjector(baseTemplate, host, hosts, isHapp);
                    if (injected) configs.push(injected);
                    continue;
                }

                const outboundConfig = this.buildOutboundConfig(host, isHapp);
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
        host: IFormattedHost,
        isHapp: boolean,
        tag = 'proxy',
    ): XrayJsonConfig | null {
        try {
            const outbound = this.buildOutbound(host, tag);

            const config: XrayJsonConfig = {
                remarks: host.remark,
                outbounds: [outbound],
            };

            if (isHapp && host.serverDescription) {
                config.meta = {
                    serverDescription: Buffer.from(host.serverDescription, 'base64').toString(),
                };
            }

            return config;
        } catch (error) {
            this.logger.error(`Error creating config for host: ${error}`);
            return null;
        }
    }

    private buildOutbound(host: IFormattedHost, tag: string): Outbound {
        const protocolBuilder = PROTOCOL_BUILDERS[host.protocol];

        const outbound: Outbound = {
            tag,
            protocol: host.protocol,
            settings: protocolBuilder(host) ?? { vnext: [] },
            streamSettings: this.buildStreamSettings(host),
        };

        if (isNonEmptyObject(host.muxParams)) {
            outbound.mux = host.muxParams;
        }

        return outbound;
    }

    private buildStreamSettings(host: IFormattedHost): StreamSettings {
        const network = host.network || 'tcp';
        const transportKey = TRANSPORT_KEY_MAP[network];

        const streamSettings: StreamSettings = {
            network,
            ...(network in TRANSPORT_BUILDERS && transportKey
                ? { [transportKey]: TRANSPORT_BUILDERS[network](host) }
                : {}),
        };

        if (host.tls === 'tls') {
            streamSettings.security = 'tls';
            streamSettings.tlsSettings = buildTlsSettings(host);
        } else if (host.tls === 'reality') {
            streamSettings.security = 'reality';
            streamSettings.realitySettings = buildRealitySettings(host);
        }

        if (isNonEmptyObject(host.sockoptParams)) {
            streamSettings.sockopt = host.sockoptParams;
        }

        return streamSettings;
    }

    private applyRemnawaveInjector(
        baseTemplate: XrayJsonConfig,
        host: IFormattedHost,
        allHosts: IFormattedHost[],
        isHapp: boolean,
    ): XrayJsonConfig | null {
        const { remnawave: injector, ...template } = baseTemplate;
        if (!injector?.injectHosts?.length) return null;

        const injectedOutbounds: Outbound[] = [];

        for (const entry of injector.injectHosts) {
            for (const [index, uuid] of entry.hostUuids.entries()) {
                const hiddenHost = allHosts.find(
                    (h) => h.serviceInfo.uuid === uuid && h.serviceInfo.isHidden,
                );
                if (!hiddenHost) continue;

                const tag = index === 0 ? entry.tagPrefix : `${entry.tagPrefix}-${index + 1}`;

                injectedOutbounds.push(this.buildOutbound(hiddenHost, tag));
            }
        }

        if (injectedOutbounds.length === 0) return null;

        const config: XrayJsonConfig = {
            ...template,
            outbounds: [...injectedOutbounds, ...template.outbounds],
            remarks: host.remark,
        };

        if (isHapp && host.serverDescription) {
            config.meta = {
                serverDescription: Buffer.from(host.serverDescription, 'base64').toString(),
            };
        }

        return config;
    }
}
