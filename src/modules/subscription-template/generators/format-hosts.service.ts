import { randomUUID } from 'node:crypto';
import { filter, shuffle } from 'lodash';
import { customAlphabet } from 'nanoid';

import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

import {
    GrpcObject,
    HttpUpgradeObject,
    StreamSettingsObject,
    TcpObject,
    WebSocketObject,
    xHttpObject,
} from '@common/helpers/xray-config/interfaces/transport.config';
import {
    resolveEncryptionFromDecryption,
    resolveInboundAndMlDsa65PublicKey,
    resolveInboundAndPublicKey,
} from '@common/helpers/xray-config';
import { RawObject } from '@common/helpers/xray-config/interfaces/transport.config';
import { TemplateEngine } from '@common/utils/templates/replace-templates-values';
import { InboundObject } from '@common/helpers/xray-config/interfaces';
import { setVlessRouteForUuid } from '@common/utils/vless-route';
import { getVlessFlow } from '@common/utils/flow';
import { SECURITY_LAYERS, USERS_STATUS } from '@libs/contracts/constants';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities/subscription-settings.entity';
import { HostWithRawInbound } from '@modules/hosts/entities/host-with-inbound-tag.entity';
import { ExternalSquadEntity } from '@modules/external-squads/entities';
import { UserEntity } from '@modules/users/entities';

import { IFormattedHost } from './interfaces/formatted-hosts.interface';

interface IGenerateFormattedHostsOptions {
    subscriptionSettings: SubscriptionSettingsEntity | null;
    hosts: HostWithRawInbound[];
    user: UserEntity;
    hostsOverrides?: ExternalSquadEntity['hostOverrides'];
    returnDbHost?: boolean;
    fallbackOptions?: {
        showHwidMaxDeviceRemarks?: boolean;
        showHwidNotSupportedRemarks?: boolean;
    };
}

@Injectable()
export class FormatHostsService {
    private readonly nanoid: ReturnType<typeof customAlphabet>;
    private readonly subPublicDomain: string;
    private readonly domainRegex =
        /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

    constructor(private readonly configService: ConfigService) {
        this.nanoid = customAlphabet('0123456789abcdefghjkmnopqrstuvwxyz', 10);
        this.subPublicDomain = this.configService.getOrThrow('SUB_PUBLIC_DOMAIN');
    }

    public async generateFormattedHosts(
        options: IGenerateFormattedHostsOptions,
    ): Promise<IFormattedHost[]> {
        let hosts = options.hosts;
        const {
            user,
            hostsOverrides,
            returnDbHost = false,
            subscriptionSettings,
            fallbackOptions,
        } = options;

        const formattedHosts: IFormattedHost[] = [];

        if (subscriptionSettings === null) {
            return formattedHosts;
        }

        if (fallbackOptions && subscriptionSettings.isShowCustomRemarks) {
            if (fallbackOptions.showHwidMaxDeviceRemarks) {
                return this.createFallbackHosts(
                    subscriptionSettings.customRemarks.HWIDMaxDevicesExceeded.map((remark) =>
                        TemplateEngine.formatWithUser(
                            remark,
                            user,
                            subscriptionSettings,
                            this.subPublicDomain,
                        ),
                    ),
                );
            }

            if (fallbackOptions.showHwidNotSupportedRemarks) {
                return this.createFallbackHosts(
                    subscriptionSettings.customRemarks.HWIDNotSupported.map((remark) =>
                        TemplateEngine.formatWithUser(
                            remark,
                            user,
                            subscriptionSettings,
                            this.subPublicDomain,
                        ),
                    ),
                );
            }
        }

        if (user.status !== USERS_STATUS.ACTIVE) {
            if (subscriptionSettings.isShowCustomRemarks) {
                let specialRemarks: string[] = [];

                switch (user.status) {
                    case USERS_STATUS.EXPIRED:
                        specialRemarks = subscriptionSettings.customRemarks.expiredUsers;
                        break;
                    case USERS_STATUS.DISABLED:
                        specialRemarks = subscriptionSettings.customRemarks.disabledUsers;
                        break;
                    case USERS_STATUS.LIMITED:
                        specialRemarks = subscriptionSettings.customRemarks.limitedUsers;
                        break;
                }

                const templatedRemarks = specialRemarks.map((remark) =>
                    TemplateEngine.formatWithUser(
                        remark,
                        user,
                        subscriptionSettings,
                        this.subPublicDomain,
                    ),
                );

                return this.createFallbackHosts(templatedRemarks);
            }
        }

        if (hosts.length === 0) {
            return this.createFallbackHosts(
                subscriptionSettings.customRemarks.emptyHosts.map((remark) =>
                    TemplateEngine.formatWithUser(
                        remark,
                        user,
                        subscriptionSettings,
                        this.subPublicDomain,
                    ),
                ),
            );
        }

        const publicKeyMap = await resolveInboundAndPublicKey(hosts.map((host) => host.rawInbound));
        const mldsa65PublicKeyMap = await resolveInboundAndMlDsa65PublicKey(
            hosts.map((host) => host.rawInbound),
        );
        const encryptionMap = await resolveEncryptionFromDecryption(
            hosts.map((host) => host.rawInbound),
        );

        const knownRemarks = new Map<string, number>();

        if (hosts.some((h) => h.shuffleHost)) {
            hosts = [
                ...shuffle(filter(hosts, 'shuffleHost')),
                ...filter(hosts, (h) => !h.shuffleHost),
            ];
        }

        for (const inputHost of hosts) {
            if (hostsOverrides) {
                if (hostsOverrides.vlessRouteId !== undefined) {
                    inputHost.vlessRouteId = hostsOverrides.vlessRouteId;
                }
                if (hostsOverrides.serverDescription !== undefined) {
                    inputHost.serverDescription = hostsOverrides.serverDescription;
                }
            }

            const remark = TemplateEngine.formatWithUser(
                inputHost.remark,
                user,
                subscriptionSettings,
                this.subPublicDomain,
            );

            const currentCount = knownRemarks.get(remark) || 0;
            knownRemarks.set(remark, currentCount + 1);

            let finalRemark;
            if (currentCount === 0) {
                finalRemark = remark;
            } else {
                const hasExistingSuffix = remark.includes('^~') && remark.endsWith('~^');
                // TODO: ???
                const suffix = hasExistingSuffix ? currentCount : currentCount + 1;
                finalRemark = `${remark} ^~${suffix}~^`;
            }

            const inbound = inputHost.rawInbound as InboundObject;

            let address = inputHost.address;

            if (address.includes(',')) {
                const addressList = address.split(',');
                address = addressList[Math.floor(Math.random() * addressList.length)].trim();
            } else if (address.includes('*')) {
                address = address.replace('*', this.nanoid()).trim();
            }

            const port = inputHost.port;
            let network = inbound.streamSettings?.network || 'tcp';

            let streamSettings:
                | WebSocketObject
                | xHttpObject
                | RawObject
                | TcpObject
                | GrpcObject
                | undefined;

            let pathFromConfig: string | undefined;
            let hostFromConfig: string | undefined;
            let additionalParams: IFormattedHost['additionalParams'] | undefined;
            let rawSettings: IFormattedHost['rawSettings'] | undefined;
            let xHttpExtraParams: null | object | undefined;
            let muxParams: null | object | undefined;
            let sockoptParams: null | object | undefined;
            let serverDescription: string | undefined;

            switch (network) {
                case 'xhttp': {
                    const settings = inbound.streamSettings?.xhttpSettings as xHttpObject;
                    streamSettings = settings;
                    pathFromConfig = settings?.path;
                    hostFromConfig = settings?.host;
                    additionalParams = {
                        heartbeatPeriod: settings?.extra?.heartbeatPeriod || undefined,
                        mode: settings?.mode || 'auto',
                    };

                    if (
                        inputHost.xHttpExtraParams !== null &&
                        inputHost.xHttpExtraParams !== undefined &&
                        Object.keys(inputHost.xHttpExtraParams).length > 0
                    ) {
                        xHttpExtraParams = inputHost.xHttpExtraParams;
                    } else {
                        xHttpExtraParams = null;
                    }

                    break;
                }
                case 'ws': {
                    const settings = inbound.streamSettings?.wsSettings as WebSocketObject;
                    streamSettings = settings;
                    pathFromConfig = settings?.path;
                    break;
                }
                case 'httpupgrade': {
                    const settings = inbound.streamSettings
                        ?.httpupgradeSettings as HttpUpgradeObject;
                    streamSettings = settings;
                    pathFromConfig = settings?.path;
                    break;
                }
                case 'grpc': {
                    const settings = inbound.streamSettings?.grpcSettings as GrpcObject;
                    streamSettings = settings;
                    pathFromConfig = settings?.serviceName;
                    hostFromConfig = settings?.authority;
                    additionalParams = {
                        grpcMultiMode: settings?.multiMode,
                    };

                    break;
                }
                case 'raw': {
                    const settings = inbound.streamSettings?.rawSettings as RawObject;

                    streamSettings = settings;

                    rawSettings = {
                        headerType: settings?.header?.type,
                        request: settings?.header?.request,
                    };

                    // fallback to tcp
                    network = 'tcp';

                    break;
                }
                case 'tcp': {
                    if (inbound.protocol === 'shadowsocks') {
                        break;
                    }

                    const settings = inbound.streamSettings?.tcpSettings as TcpObject;
                    // eslint-disable-next-line
                    streamSettings = settings;
                    rawSettings = {
                        headerType: settings?.header?.type,
                        request: settings?.header?.request,
                    };

                    break;
                }
            }

            let tlsFromConfig: StreamSettingsObject['security'] | undefined | '';
            let sniFromConfig: string | undefined;
            let fingerprintFromConfig: string | undefined;
            let alpnFromConfig: string | undefined;
            let publicKeyFromConfig: string | undefined;
            let shortIdFromConfig: string | undefined;
            let spiderXFromConfig: string | undefined;
            let mldsa65PublicKeyFromConfig: string | undefined;

            switch (inbound.streamSettings?.security) {
                case 'tls':
                    tlsFromConfig = 'tls';
                    const tlsSettings = inbound.streamSettings?.tlsSettings;
                    sniFromConfig = tlsSettings?.serverName;
                    fingerprintFromConfig = tlsSettings?.fingerprint;
                    if (tlsSettings?.alpn) {
                        if (Array.isArray(tlsSettings?.alpn)) {
                            alpnFromConfig = tlsSettings?.alpn?.join(',');
                        } else if (typeof tlsSettings?.alpn === 'string') {
                            alpnFromConfig = tlsSettings?.alpn;
                        }
                    } else {
                        alpnFromConfig = undefined;
                    }
                    break;
                case 'reality':
                    tlsFromConfig = 'reality';
                    const realitySettings = inbound.streamSettings?.realitySettings;
                    sniFromConfig = realitySettings?.serverNames?.[0];
                    fingerprintFromConfig = realitySettings?.fingerprint;

                    publicKeyFromConfig = publicKeyMap.get(inbound.tag);
                    mldsa65PublicKeyFromConfig = mldsa65PublicKeyMap.get(inbound.tag);

                    spiderXFromConfig = realitySettings?.spiderX;
                    const shortIds = inbound.streamSettings?.realitySettings?.shortIds || [];
                    shortIdFromConfig =
                        shortIds.length > 0
                            ? shortIds[Math.floor(Math.random() * shortIds.length)]
                            : '';

                    break;
                case 'none':
                    tlsFromConfig = 'none';
                    break;
                default:
                    tlsFromConfig = '';
                    break;
            }

            // Security Layer Override
            if (inputHost.securityLayer !== SECURITY_LAYERS.DEFAULT) {
                switch (inputHost.securityLayer) {
                    case SECURITY_LAYERS.TLS:
                        tlsFromConfig = 'tls';
                        break;
                    case SECURITY_LAYERS.NONE:
                        tlsFromConfig = 'none';
                        break;
                    default:
                        break;
                }
            }

            if (
                inputHost.muxParams !== null &&
                inputHost.muxParams !== undefined &&
                Object.keys(inputHost.muxParams).length > 0
            ) {
                muxParams = inputHost.muxParams;
            } else {
                muxParams = null;
            }

            if (
                inputHost.sockoptParams !== null &&
                inputHost.sockoptParams !== undefined &&
                Object.keys(inputHost.sockoptParams).length > 0
            ) {
                sockoptParams = inputHost.sockoptParams;
            } else {
                sockoptParams = null;
            }

            if (inputHost.serverDescription !== undefined && inputHost.serverDescription !== null) {
                serverDescription = Buffer.from(inputHost.serverDescription).toString('base64');
            }

            const protocol = inbound.protocol;
            const path = inputHost.path || pathFromConfig || '';

            let host = inputHost.host || hostFromConfig || '';

            if (host.includes('*')) {
                host = host.replace('*', this.nanoid()).trim();
            }

            const tls = tlsFromConfig;

            const isDomain = (str: string): boolean => {
                return this.domainRegex.test(str);
            };

            let sni = inputHost.sni || sniFromConfig;

            if (!sni) {
                sni = '';
            }

            if (!sni && isDomain(inputHost.address)) {
                sni = inputHost.address;
            }

            if (sni.includes('*.')) {
                sni = sni.replace('*', this.nanoid());
            } else if (sni.includes(',')) {
                const sniList = sni.split(',');
                sni = sniList[Math.floor(Math.random() * sniList.length)].trim();
            }

            // Fingerprint
            const fp = inputHost.fingerprint || fingerprintFromConfig || '';

            // ALPN
            const alpn = inputHost.alpn || alpnFromConfig || '';

            // Public key
            const pbk = publicKeyFromConfig || '';

            // Short ID
            const sid = shortIdFromConfig || '';

            const spiderX = spiderXFromConfig || '';

            let dbData: IFormattedHost['dbData'] | undefined;

            if (returnDbHost) {
                dbData = {
                    rawInbound: inputHost.rawInbound,
                    inboundTag: inputHost.inboundTag,
                    uuid: inputHost.uuid,
                    configProfileUuid: inputHost.configProfileUuid,
                    configProfileInboundUuid: inputHost.configProfileInboundUuid,
                    isDisabled: inputHost.isDisabled,
                    viewPosition: inputHost.viewPosition,
                    remark: inputHost.remark,
                    isHidden: inputHost.isHidden,
                    tag: inputHost.tag,
                    vlessRouteId: inputHost.vlessRouteId,
                };
            }

            // overrides

            if (inputHost.overrideSniFromAddress) {
                sni = address;
            }

            if (inputHost.keepSniBlank) {
                sni = '';
            }

            formattedHosts.push({
                remark: finalRemark,
                address,
                port,
                protocol,
                path,
                host,
                tls,
                sni,
                alpn,
                publicKey: pbk,
                fingerprint: fp,
                shortId: sid,
                rawSettings,
                spiderX,
                network,
                password: {
                    trojanPassword: user.trojanPassword,
                    vlessPassword: setVlessRouteForUuid(user.vlessUuid, inputHost.vlessRouteId),
                    ssPassword: user.ssPassword,
                },
                additionalParams,
                xHttpExtraParams,
                serverDescription,
                muxParams,
                sockoptParams,
                allowInsecure: inputHost.allowInsecure,
                shuffleHost: inputHost.shuffleHost,
                mihomoX25519: inputHost.mihomoX25519,
                dbData,
                mldsa65Verify: mldsa65PublicKeyFromConfig,
                encryption: encryptionMap.get(inputHost.inboundTag),
                flow: getVlessFlow(inbound),
                xrayJsonTemplate: inputHost.xrayJsonTemplate,
                serviceInfo: {
                    uuid: inputHost.uuid,
                    isHidden: inputHost.isHidden,
                    tag: inputHost.tag,
                },
            });
        }

        return formattedHosts;
    }

    private createFallbackHosts(remarks: string[]): IFormattedHost[] {
        return remarks.map((remark) => ({
            remark,
            address: '0.0.0.0',
            port: 1,
            protocol: 'vless',
            path: '',
            host: '',
            tls: '',
            sni: '',
            alpn: '',
            publicKey: '',
            fingerprint: '',
            shortId: '',
            spiderX: '',
            network: 'tcp',
            password: {
                trojanPassword: '00000',
                vlessPassword: randomUUID(),
                ssPassword: '00000',
            },
            serviceInfo: {
                uuid: '00000000-0000-0000-0000-000000000000',
                isHidden: false,
                tag: null,
            },
        }));
    }
}
