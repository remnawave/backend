import { Injectable, Logger } from '@nestjs/common';

import { SubscriptionTemplateService } from '../subscription-template.service';
import { IFormattedHost } from './interfaces/formatted-hosts.interface';

interface StreamSettings {
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

interface OutboundSettings {
    vnext?: Array<{
        address: string;
        port: number;
        users: Array<{
            id: string;
            security?: string;
            encryption?: string;
            flow?: string | undefined;
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

interface Outbound {
    tag: string;
    protocol: string;
    settings: OutboundSettings;
    streamSettings?: StreamSettings;
    mux?: unknown;
}

interface XrayJsonConfig {
    remarks: string;
    outbounds: Outbound[];
    meta?: {
        serverDescription?: string;
    };
}

@Injectable()
export class XrayJsonGeneratorService {
    private readonly logger = new Logger(XrayJsonGeneratorService.name);

    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    public async generateConfig(
        hosts: IFormattedHost[],
        isHapp: boolean,
        overrideTemplateName?: string,
    ): Promise<string> {
        try {
            const templateContentDb =
                await this.subscriptionTemplateService.getCachedTemplateByType(
                    'XRAY_JSON',
                    overrideTemplateName,
                );

            const templateContent = templateContentDb as unknown as XrayJsonConfig;

            const preparedXrayJsonConfigs: XrayJsonConfig[] = [];

            for (const host of hosts) {
                const templatedOutbound = this.createConfigForHost(host, isHapp);
                if (templatedOutbound) {
                    const baseTemplate = host.xrayJsonTemplate ?? templateContent;

                    preparedXrayJsonConfigs.push({
                        ...baseTemplate,
                        outbounds: [
                            ...templatedOutbound.outbounds,
                            ...(baseTemplate as XrayJsonConfig).outbounds,
                        ],
                        remarks: templatedOutbound.remarks,
                        meta: templatedOutbound.meta,
                    });
                }
            }

            return this.renderConfigs(preparedXrayJsonConfigs);
        } catch (error) {
            this.logger.error('Error generating xray-json config:', error);
            return '';
        }
    }

    private createConfigForHost(host: IFormattedHost, isHapp: boolean): XrayJsonConfig | null {
        try {
            const outbounds: Outbound[] = [];

            const mainOutbound: Outbound = {
                tag: 'proxy',
                protocol: host.protocol,
                settings: this.createOutboundSettings(host),
                streamSettings: this.createStreamSettings(host),
            };

            if (
                host.muxParams !== null &&
                host.muxParams !== undefined &&
                Object.keys(host.muxParams).length > 0
            ) {
                mainOutbound.mux = host.muxParams;
            }

            outbounds.push(mainOutbound);

            const config: XrayJsonConfig = {
                remarks: host.remark,
                outbounds: outbounds,
            };

            if (isHapp && host.serverDescription) {
                config.meta = {
                    serverDescription: Buffer.from(host.serverDescription, 'base64').toString(),
                };
            }

            return config;
        } catch (error) {
            this.logger.error('Error creating config for host:', error);
            return null;
        }
    }

    private createOutboundSettings(host: IFormattedHost): OutboundSettings {
        switch (host.protocol) {
            case 'vless':
                return {
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
                };

            case 'trojan':
                return {
                    servers: [
                        {
                            address: host.address,
                            port: host.port,
                            password: host.password.trojanPassword,
                        },
                    ],
                };

            case 'shadowsocks':
                return {
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
                };

            default:
                return { vnext: [] };
        }
    }

    private createStreamSettings(host: IFormattedHost): StreamSettings {
        const streamSettings: StreamSettings = {
            network: host.network || 'tcp',
        };

        switch (host.network) {
            case 'ws':
                streamSettings.wsSettings = this.createWsSettings(host);
                break;

            case 'httpupgrade':
                streamSettings.httpupgradeSettings = this.createHttpUpgradeSettings(host);
                break;

            case 'tcp':
            case 'raw':
                streamSettings.tcpSettings = this.createTcpSettings(host);
                break;

            case 'xhttp':
                streamSettings.xhttpSettings = this.createXHttpSettings(host);

                break;

            case 'grpc':
                streamSettings.grpcSettings = this.createGrpcSettings(host);
                break;
        }

        if (host.tls === 'tls') {
            streamSettings.security = 'tls';
            streamSettings.tlsSettings = this.createTlsSettings(host);
        } else if (host.tls === 'reality') {
            streamSettings.security = 'reality';
            streamSettings.realitySettings = this.createRealitySettings(host);
        }

        if (
            host.sockoptParams !== null &&
            host.sockoptParams !== undefined &&
            Object.keys(host.sockoptParams).length > 0
        ) {
            streamSettings.sockopt = host.sockoptParams;
        }

        return streamSettings;
    }

    private createWsSettings(host: IFormattedHost): Record<string, unknown> {
        const settings: Record<string, any> = {
            path: host.path,
            headers: {},
        };

        settings.headers.Host = host.host;

        if (host.additionalParams?.heartbeatPeriod) {
            settings.heartbeatPeriod = host.additionalParams.heartbeatPeriod;
        }

        return settings;
    }

    private createHttpUpgradeSettings(host: IFormattedHost): Record<string, unknown> {
        const settings: Record<string, any> = {
            path: host.path,
            host: host.host,
        };

        return settings;
    }

    private createTcpSettings(host: IFormattedHost): Record<string, unknown> {
        const settings: Record<string, any> = {};

        if (host.headerType === 'http') {
            settings.header = { type: 'http' };
            settings.header.request = {
                version: '1.1',
                method: 'GET',
                headers: {
                    'Accept-Encoding': ['gzip', 'deflate'],
                    Connection: ['keep-alive'],
                    Pragma: 'no-cache',
                },
            };

            if (host.path) {
                settings.header.request.path = [host.path];
            }

            settings.header.request.headers.Host = [host.host];
        }

        return settings;
    }

    private createXHttpSettings(host: IFormattedHost): Record<string, unknown> {
        const settings: Record<string, any> = {
            mode: host.additionalParams?.mode || 'auto',
        };

        settings.host = host.host;

        if (host.path !== '') {
            settings.path = host.path;
        }

        if (
            host.xHttpExtraParams !== null &&
            host.xHttpExtraParams !== undefined &&
            Object.keys(host.xHttpExtraParams).length > 0
        ) {
            settings.extra = host.xHttpExtraParams;
        }

        return settings;
    }

    private createTlsSettings(host: IFormattedHost): Record<string, unknown> {
        const settings: Record<string, unknown> = {
            serverName: host.sni || '',
            allowInsecure: false,
            show: false,
        };

        if (host.fingerprint !== '') {
            settings.fingerprint = host.fingerprint;
        }

        if (host.alpn) {
            settings.alpn = host.alpn.split(',');
        }

        if (host.allowInsecure) {
            settings.allowInsecure = host.allowInsecure;
        }

        return settings;
    }

    private createRealitySettings(host: IFormattedHost): Record<string, unknown> {
        const settings: Record<string, unknown> = {
            serverName: host.sni,
            show: false,
        };

        if (host.publicKey) {
            settings.publicKey = host.publicKey;
        }

        if (host.mldsa65Verify) {
            settings.mldsa65Verify = host.mldsa65Verify;
        }

        if (host.shortId) {
            settings.shortId = host.shortId;
        }

        if (host.spiderX) {
            settings.spiderX = host.spiderX;
        }

        if (host.fingerprint !== '') {
            settings.fingerprint = host.fingerprint;
        }

        return settings;
    }

    private createGrpcSettings(host: IFormattedHost): Record<string, unknown> {
        const settings: Record<string, unknown> = {
            serviceName: host.path,
            authority: host.host,
            mode: host.additionalParams?.grpcMultiMode ? true : false,
        };

        return settings;
    }

    private renderConfigs(templateContent: XrayJsonConfig[]): string {
        return JSON.stringify(templateContent, null, 0);
    }
}
