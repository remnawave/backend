import {
    GRPCConfig,
    HTTPUpgradeConfig,
    HysteriaConfig,
    InboundConfig,
    KCPConfig,
    SplitHTTPConfig,
    StreamSettingsConfig,
    TCPConfig,
    WebSocketConfig,
} from 'xray-typed';
import { filter, shuffle } from 'lodash';
import { customAlphabet } from 'nanoid';

import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

import {
    resolveEncryptionFromDecryption,
    resolveInboundAndMlDsa65PublicKey,
    resolveInboundAndPublicKey,
} from '@common/helpers/xray-config';
import { getSsPassword, isSS2022MethodFromMethod } from '@common/helpers/xray-config/ss-cipher';
import { TemplateEngine } from '@common/utils/templates/replace-templates-values';
import { setVlessRouteForUuid } from '@common/utils/vless-route';
import { getVlessFlow } from '@common/utils/flow';
import { SECURITY_LAYERS, USERS_STATUS } from '@libs/contracts/constants';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities/subscription-settings.entity';
import { HostWithRawInbound } from '@modules/hosts/entities/host-with-inbound-tag.entity';
import { ExternalSquadEntity } from '@modules/external-squads/entities';
import { UserEntity } from '@modules/users/entities';

import {
    GrpcTransport,
    HttpUpgradeTransport,
    HysteriaTransport,
    KcpTransport,
    ProtocolVariant,
    ResolvedProxyConfig,
    SecurityVariant,
    TcpTransport,
    TransportVariant,
    WsTransport,
    XHttpTransport,
} from './interfaces';
import { override, toNonEmptyRecord } from './utils';

interface IResolveProxyConfigOptions {
    subscriptionSettings: SubscriptionSettingsEntity | null;
    hosts: HostWithRawInbound[];
    user: UserEntity;
    hostsOverrides?: ExternalSquadEntity['hostOverrides'];
    fallbackOptions?: {
        showHwidMaxDeviceRemarks?: boolean;
        showHwidNotSupportedRemarks?: boolean;
    };
}

@Injectable()
export class ResolveProxyConfigService {
    private readonly nanoid: ReturnType<typeof customAlphabet>;
    private readonly subPublicDomain: string;
    private readonly domainRegex =
        /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

    constructor(private readonly configService: ConfigService) {
        this.nanoid = customAlphabet('0123456789abcdefghjkmnopqrstuvwxyz', 10);
        this.subPublicDomain = this.configService.getOrThrow('SUB_PUBLIC_DOMAIN');
    }

    public async resolveProxyConfig(
        options: IResolveProxyConfigOptions,
    ): Promise<ResolvedProxyConfig[]> {
        const { user, hostsOverrides, subscriptionSettings, fallbackOptions } = options;

        if (subscriptionSettings === null) {
            return [];
        }

        const earlyRemarks = this.resolveEarlyExitRemarks(
            user,
            subscriptionSettings,
            fallbackOptions,
            options.hosts.length,
        );
        if (earlyRemarks !== null) {
            return this.createFallbackHosts(
                this.templateRemarks(earlyRemarks, user, subscriptionSettings),
            );
        }

        const hosts = this.applyShuffle(options.hosts);

        const rawInbounds = hosts.map((h) => h.rawInbound);
        const [publicKeyMap, mldsa65PublicKeyMap, encryptionMap] = await Promise.all([
            resolveInboundAndPublicKey(rawInbounds),
            resolveInboundAndMlDsa65PublicKey(rawInbounds),
            resolveEncryptionFromDecryption(rawInbounds),
        ]);

        const knownRemarks = new Map<string, number>();
        const resolvedProxyConfigs: ResolvedProxyConfig[] = [];

        for (const inputHost of hosts) {
            this.applyHostOverrides(inputHost, hostsOverrides);

            const finalRemark = this.deduplicateRemark(
                TemplateEngine.formatWithUser(
                    inputHost.remark,
                    user,
                    subscriptionSettings,
                    this.subPublicDomain,
                ),
                knownRemarks,
            );

            const resolvedProxyConfig = this.buildResolvedProxyConfig({
                inputHost,
                inbound: inputHost.rawInbound as InboundConfig,
                finalRemark,
                user,
                publicKeyMap,
                mldsa65PublicKeyMap,
                encryptionMap,
            });

            if (resolvedProxyConfig) {
                resolvedProxyConfigs.push(resolvedProxyConfig);
            }
        }

        return resolvedProxyConfigs;
    }

    private resolveEarlyExitRemarks(
        user: UserEntity,
        settings: SubscriptionSettingsEntity,
        fallbackOptions: IResolveProxyConfigOptions['fallbackOptions'],
        hostCount: number,
    ): string[] | null {
        if (settings.isShowCustomRemarks) {
            if (fallbackOptions) {
                if (fallbackOptions.showHwidMaxDeviceRemarks) {
                    return settings.customRemarks.HWIDMaxDevicesExceeded;
                }
                if (fallbackOptions.showHwidNotSupportedRemarks) {
                    return settings.customRemarks.HWIDNotSupported;
                }
            }

            if (user.status !== USERS_STATUS.ACTIVE) {
                const statusRemarksMap: Partial<Record<string, string[]>> = {
                    [USERS_STATUS.EXPIRED]: settings.customRemarks.expiredUsers,
                    [USERS_STATUS.DISABLED]: settings.customRemarks.disabledUsers,
                    [USERS_STATUS.LIMITED]: settings.customRemarks.limitedUsers,
                };
                return statusRemarksMap[user.status] ?? [];
            }
        }

        if (hostCount === 0) {
            return settings.customRemarks.emptyHosts;
        }

        return null;
    }

    private resolveTransport(
        streamSettings: StreamSettingsConfig | undefined,
        inputHost: HostWithRawInbound,
        vlessUuid: string,
    ): TransportVariant {
        const rawNetwork = streamSettings?.network;

        if (rawNetwork === undefined || !streamSettings) {
            return {
                transport: 'tcp',
                transportOptions: {
                    header: null,
                },
            };
        }

        switch (rawNetwork) {
            case 'xhttp':
                return this.resolveXhttp(streamSettings.xhttpSettings, inputHost);
            case 'ws':
                return this.resolveWs(streamSettings.wsSettings, inputHost);
            case 'httpupgrade':
                return this.resolveHttpUpgrade(streamSettings.httpupgradeSettings, inputHost);
            case 'grpc':
                return this.resolveGrpc(streamSettings.grpcSettings, inputHost);
            case 'raw':
                return this.resolveTcp(streamSettings.rawSettings, inputHost);
            case 'tcp':
                return this.resolveTcp(streamSettings.tcpSettings, inputHost);
            case 'kcp':
                return this.resolveKcp(streamSettings.kcpSettings);
            case 'hysteria':
                return this.resolveHysteria(streamSettings.hysteriaSettings, vlessUuid);
            default:
                return {
                    transport: 'tcp',
                    transportOptions: {
                        header: null,
                    },
                };
        }
    }

    private resolveXhttp(
        settings: SplitHTTPConfig | undefined,
        inputHost: HostWithRawInbound,
    ): XHttpTransport {
        return {
            transport: 'xhttp',
            transportOptions: {
                path: override(inputHost.path, settings?.path),
                host: this.resolveRandomizedValue(override(inputHost.host, settings?.host) ?? ''),
                mode: settings?.mode ?? 'auto',
                extra: override(toNonEmptyRecord(inputHost.xHttpExtraParams), settings?.extra),
            },
        };
    }

    private resolveWs(
        settings: WebSocketConfig | undefined,
        inputHost: HostWithRawInbound,
    ): WsTransport {
        return {
            transport: 'ws',
            transportOptions: {
                host: this.resolveRandomizedValue(override(inputHost.host, settings?.host) ?? ''),
                path: override(inputHost.path, settings?.path),
                headers: settings?.headers ?? null,
                heartbeatPeriod: settings?.heartbeatPeriod ?? null,
            },
        };
    }

    private resolveHttpUpgrade(
        settings: HTTPUpgradeConfig | undefined,
        inputHost: HostWithRawInbound,
    ): HttpUpgradeTransport {
        return {
            transport: 'httpupgrade',
            transportOptions: {
                path: override(inputHost.path, settings?.path),
                host: this.resolveRandomizedValue(override(inputHost.host, settings?.host) ?? ''),
                headers: settings?.headers ?? null,
            },
        };
    }

    private resolveGrpc(
        settings: GRPCConfig | undefined,
        inputHost: HostWithRawInbound,
    ): GrpcTransport {
        return {
            transport: 'grpc',
            transportOptions: {
                authority: this.resolveRandomizedValue(
                    override(inputHost.host, settings?.authority) ?? '',
                ),
                serviceName: override(inputHost.path, settings?.serviceName),
                multiMode: !!settings?.multiMode,
            },
        };
    }

    private resolveTcp(
        settings: TCPConfig | undefined,
        inputHost: HostWithRawInbound,
    ): TcpTransport {
        if (settings && settings.header && settings.header.type === 'http') {
            let baseRequest = structuredClone(settings.header.request);
            if (!baseRequest) {
                baseRequest = {
                    version: '1.1',
                    method: 'GET',
                    headers: {
                        'Accept-Encoding': ['gzip', 'deflate'],
                        Connection: ['keep-alive'],
                        Pragma: ['no-cache'],
                    },
                };
            } else {
                baseRequest.headers = baseRequest.headers || {};

                if (inputHost.host) {
                    baseRequest.headers.Host = [this.resolveRandomizedValue(inputHost.host)];
                }

                if (inputHost.path) {
                    baseRequest.path = [inputHost.path];
                }
            }

            return {
                transport: 'tcp',
                transportOptions: {
                    header: {
                        type: 'http',
                        request: baseRequest,
                    },
                },
            };
        }

        return {
            transport: 'tcp',
            transportOptions: {
                header: settings?.header ?? null,
            },
        };
    }

    private resolveKcp(settings: KCPConfig | undefined): KcpTransport {
        return {
            transport: 'kcp',
            transportOptions: {
                clientMtu: settings?.clientMtu || settings?.mtu || 1350,
                tti: settings?.tti || 50,
                congestion: settings?.congestion || false,
            },
        };
    }

    private resolveHysteria(
        settings: HysteriaConfig | undefined,
        vlessUuid: string,
    ): HysteriaTransport {
        return {
            transport: 'hysteria',
            transportOptions: {
                version: 2,
                auth: vlessUuid,
            },
        };
    }

    private resolveSecurity(
        streamSettings: StreamSettingsConfig | undefined,
        inputHost: HostWithRawInbound,
        inboundTag: string,
        publicKeyMap: Map<string, string>,
        mldsa65Map: Map<string, string>,
        resolvedAddress: string,
    ): SecurityVariant {
        if (!streamSettings) {
            return {
                security: 'none',
            };
        }

        let effectiveSecurity = streamSettings.security;
        if (inputHost.securityLayer !== SECURITY_LAYERS.DEFAULT) {
            switch (inputHost.securityLayer) {
                case SECURITY_LAYERS.TLS:
                    effectiveSecurity = 'tls';
                    break;
                case SECURITY_LAYERS.NONE:
                    effectiveSecurity = 'none';
                    break;
            }
        }

        switch (effectiveSecurity) {
            case 'tls': {
                const tls = streamSettings.tlsSettings;
                const alpn =
                    override(
                        inputHost.alpn,
                        Array.isArray(tls?.alpn) ? tls.alpn.join(',') : tls?.alpn,
                    ) ?? '';

                return {
                    security: 'tls',
                    securityOptions: {
                        allowInsecure: inputHost.allowInsecure,
                        alpn,
                        enableSessionResumption: !!tls?.enableSessionResumption,
                        fingerprint: override(inputHost.fingerprint, tls?.fingerprint) ?? 'chrome',
                        serverName: this.resolveFinalServerName(
                            inputHost,
                            streamSettings.tlsSettings?.serverName,
                            resolvedAddress,
                        ),
                        echConfigList: tls?.echConfigList || null,
                        echForceQuery: tls?.echForceQuery || null,
                    },
                };
            }
            case 'reality': {
                const reality = streamSettings.realitySettings;
                const shortIds = reality?.shortIds || [];
                const shortId =
                    shortIds.length > 0
                        ? shortIds[Math.floor(Math.random() * shortIds.length)]
                        : '';

                return {
                    security: 'reality',
                    securityOptions: {
                        fingerprint:
                            override(inputHost.fingerprint, reality?.fingerprint) ?? 'chrome',
                        publicKey: publicKeyMap.get(inboundTag) || '',
                        shortId,
                        serverName: this.resolveFinalServerName(
                            inputHost,
                            reality?.serverNames?.[0],
                            resolvedAddress,
                        ),
                        spiderX: reality?.spiderX || '',
                        mldsa65Verify: mldsa65Map.get(inboundTag) ?? null,
                    },
                };
            }
            case 'none':
                return { security: 'none' };
            default:
                return { security: 'none' };
        }
    }

    private resolveFinalServerName(
        inputHost: HostWithRawInbound,
        serverName: string | undefined,
        resolvedAddress: string,
    ): string {
        if (inputHost.keepSniBlank) {
            return '';
        }

        if (inputHost.overrideSniFromAddress) {
            return resolvedAddress;
        }

        let baseSni = serverName ?? '';

        if (inputHost.sni) {
            baseSni = inputHost.sni;
        }

        if (!baseSni && this.isDomain(inputHost.address)) {
            baseSni = inputHost.address;
        }

        return this.resolveRandomizedValue(baseSni);
    }

    private resolveProtocolOptions(
        inputHost: HostWithRawInbound,
        inbound: InboundConfig,
        user: UserEntity,
        encryption?: string,
    ): ProtocolVariant | null {
        if (!inbound.settings) {
            return null;
        }

        switch (inbound.protocol) {
            case 'vless':
                return {
                    protocol: 'vless',
                    protocolOptions: {
                        id: setVlessRouteForUuid(user.vlessUuid, inputHost.vlessRouteId),
                        encryption: encryption ?? 'none',
                        flow: getVlessFlow(inbound),
                    },
                };
            case 'trojan':
                return {
                    protocol: 'trojan',
                    protocolOptions: {
                        password: user.trojanPassword,
                    },
                };
            case 'shadowsocks':
                const settings = inbound.settings;

                let clientPassword = user.ssPassword;

                if (isSS2022MethodFromMethod(settings.method) && 'password' in settings) {
                    clientPassword = `${settings.password}:${getSsPassword(user.ssPassword, true)}`;
                }

                return {
                    protocol: 'shadowsocks',
                    protocolOptions: {
                        method: settings.method || 'chacha20-ietf-poly1305',
                        password: clientPassword,
                        uot: settings.uot || false,
                        uotVersion: settings.uotVersion || 1,
                    },
                };
            case 'hysteria':
                return {
                    protocol: 'hysteria',
                    protocolOptions: {
                        version: 2,
                    },
                };
            default:
                return null;
        }
    }

    private buildResolvedProxyConfig(ctx: {
        inputHost: HostWithRawInbound;
        inbound: InboundConfig;
        finalRemark: string;
        user: UserEntity;
        publicKeyMap: Map<string, string>;
        mldsa65PublicKeyMap: Map<string, string>;
        encryptionMap: Map<string, string>;
    }): ResolvedProxyConfig | null {
        const { inputHost, inbound, finalRemark, user } = ctx;

        const address = this.resolveRandomizedValue(inputHost.address);

        const protocol = this.resolveProtocolOptions(
            inputHost,
            inbound,
            user,
            ctx.encryptionMap.get(inputHost.inboundTag),
        );

        if (!protocol) {
            return null;
        }

        const transport = this.resolveTransport(inbound.streamSettings, inputHost, user.vlessUuid);

        const security = this.resolveSecurity(
            inbound.streamSettings,
            inputHost,
            inbound.tag!,
            ctx.publicKeyMap,
            ctx.mldsa65PublicKeyMap,
            address,
        );

        return {
            finalRemark: finalRemark,
            address: address,
            port: inputHost.port,
            streamOverrides: {
                finalMask: override(
                    toNonEmptyRecord(inputHost.finalMask),
                    toNonEmptyRecord(inbound.streamSettings?.finalmask),
                ),
                sockopt: toNonEmptyRecord(inputHost.sockoptParams),
            },
            mux: toNonEmptyRecord(inputHost.muxParams),
            clientOverrides: {
                shuffleHost: inputHost.shuffleHost,
                mihomoX25519: inputHost.mihomoX25519,
                serverDescription: inputHost.serverDescription
                    ? Buffer.from(inputHost.serverDescription).toString('base64')
                    : null,
                xrayJsonTemplate: inputHost.xrayJsonTemplate,
            },
            metadata: {
                uuid: inputHost.uuid,
                tag: inputHost.tag,
                excludeFromSubscriptionTypes: inputHost.excludeFromSubscriptionTypes,
                inboundTag: inputHost.inboundTag,
                configProfileUuid: inputHost.configProfileUuid,
                configProfileInboundUuid: inputHost.configProfileInboundUuid,
                isDisabled: inputHost.isDisabled,
                isHidden: inputHost.isHidden,
                viewPosition: inputHost.viewPosition,
                remark: inputHost.remark,
                vlessRouteId: inputHost.vlessRouteId,
                rawInbound: inputHost.rawInbound,
            },
            ...protocol,
            ...security,
            ...transport,
        } satisfies ResolvedProxyConfig;
    }

    private resolveRandomizedValue(value: string): string {
        if (!value) return value;

        if (value.includes(',')) {
            const parts = value.split(',');
            return parts[Math.floor(Math.random() * parts.length)].trim();
        }

        if (value.includes('*')) {
            return value.replace('*', this.nanoid()).trim();
        }

        return value;
    }

    private isDomain(str: string): boolean {
        return this.domainRegex.test(str);
    }

    private deduplicateRemark(remark: string, knownRemarks: Map<string, number>): string {
        const currentCount = knownRemarks.get(remark) || 0;
        knownRemarks.set(remark, currentCount + 1);

        if (currentCount === 0) {
            return remark;
        }

        const hasExistingSuffix = remark.includes('^~') && remark.endsWith('~^');
        const suffix = hasExistingSuffix ? currentCount : currentCount + 1;
        return `${remark} ^~${suffix}~^`;
    }

    private applyHostOverrides(
        host: HostWithRawInbound,
        overrides?: ExternalSquadEntity['hostOverrides'],
    ): void {
        if (!overrides) return;

        if (overrides.vlessRouteId !== undefined) {
            host.vlessRouteId = overrides.vlessRouteId;
        }
        if (overrides.serverDescription !== undefined) {
            host.serverDescription = overrides.serverDescription;
        }
    }

    private applyShuffle(hosts: HostWithRawInbound[]): HostWithRawInbound[] {
        if (!hosts.some((h) => h.shuffleHost)) {
            return hosts;
        }
        return [...shuffle(filter(hosts, 'shuffleHost')), ...filter(hosts, (h) => !h.shuffleHost)];
    }

    private templateRemarks(
        remarks: string[],
        user: UserEntity,
        settings: SubscriptionSettingsEntity,
    ): string[] {
        return remarks.map((remark) =>
            TemplateEngine.formatWithUser(remark, user, settings, this.subPublicDomain),
        );
    }

    private createFallbackHosts(remarks: string[]): ResolvedProxyConfig[] {
        return remarks.map(
            (remark) =>
                ({
                    finalRemark: remark,
                    address: '0.0.0.0',
                    port: 1,
                    streamOverrides: {
                        finalMask: null,
                        sockopt: null,
                    },
                    mux: null,
                    protocol: 'vless',
                    protocolOptions: {
                        id: '00000000-0000-0000-0000-000000000000',
                        encryption: 'none',
                        flow: '',
                    },
                    transport: 'tcp',
                    transportOptions: {
                        header: null,
                    },
                    security: 'none',
                    clientOverrides: {
                        shuffleHost: false,
                        mihomoX25519: false,
                        serverDescription: null,
                        xrayJsonTemplate: null,
                    },
                    metadata: {
                        uuid: '00000000-0000-0000-0000-000000000000',
                        tag: null,
                        excludeFromSubscriptionTypes: [],
                        inboundTag: '',
                        configProfileUuid: null,
                        configProfileInboundUuid: null,
                        isDisabled: false,
                        isHidden: false,
                        viewPosition: 0,
                        remark: remark,
                        vlessRouteId: null,
                        rawInbound: null,
                    },
                }) satisfies ResolvedProxyConfig,
        );
    }
}
