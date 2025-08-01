import { randomUUID } from 'node:crypto';
import { customAlphabet } from 'nanoid';

import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import {
    HttpUpgradeObject,
    StreamSettingsObject,
    TcpObject,
    WebSocketObject,
    xHttpObject,
} from '@common/helpers/xray-config/interfaces/transport.config';
import { RawObject } from '@common/helpers/xray-config/interfaces/transport.config';
import { TemplateEngine } from '@common/utils/templates/replace-templates-values';
import { resolveInboundAndPublicKey } from '@common/helpers/xray-config';
import { ICommandResponse } from '@common/types/command-response.type';
import { InboundObject } from '@common/helpers/xray-config/interfaces';
import { SECURITY_LAYERS, USERS_STATUS } from '@libs/contracts/constants';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities/subscription-settings.entity';
import { GetSubscriptionSettingsQuery } from '@modules/subscription-settings/queries/get-subscription-settings';
import { HostWithRawInbound } from '@modules/hosts/entities/host-with-inbound-tag.entity';
import { UserEntity } from '@modules/users/entities';

import { IFormattedHost } from './interfaces/formatted-hosts.interface';

@Injectable()
export class FormatHostsService {
    private readonly nanoid: ReturnType<typeof customAlphabet>;
    private readonly subPublicDomain: string;

    constructor(
        private readonly queryBus: QueryBus,
        private readonly configService: ConfigService,
    ) {
        this.nanoid = customAlphabet('0123456789abcdefghjkmnopqrstuvwxyz', 10);
        this.subPublicDomain = this.configService.getOrThrow('SUB_PUBLIC_DOMAIN');
    }

    public async generateFormattedHosts(
        hosts: HostWithRawInbound[],
        user: UserEntity,
    ): Promise<IFormattedHost[]> {
        const formattedHosts: IFormattedHost[] = [];

        let specialRemarks: string[] = [];

        if (user.status !== USERS_STATUS.ACTIVE) {
            const settings = await this.getSubscriptionSettings();
            if (!settings) {
                return formattedHosts;
            }

            if (settings.isShowCustomRemarks) {
                switch (user.status) {
                    case USERS_STATUS.EXPIRED:
                        specialRemarks = settings.expiredUsersRemarks;
                        break;
                    case USERS_STATUS.DISABLED:
                        specialRemarks = settings.disabledUsersRemarks;
                        break;
                    case USERS_STATUS.LIMITED:
                        specialRemarks = settings.limitedUsersRemarks;
                        break;
                }

                const templatedRemarks = specialRemarks.map((remark) =>
                    TemplateEngine.formatWithUser(remark, user, this.subPublicDomain),
                );

                formattedHosts.push(...this.createFallbackHosts(templatedRemarks));

                return formattedHosts;
            }
        }

        if (hosts.length === 0 && user.activeInternalSquads.length > 0) {
            formattedHosts.push(
                ...this.createFallbackHosts([
                    '→ Remnawave',
                    '→ Did you forget to add internal squads?',
                    '→ No internal squads found',
                ]),
            );

            return formattedHosts;
        }

        if (hosts.length === 0) {
            formattedHosts.push(
                ...this.createFallbackHosts([
                    '→ Remnawave',
                    '→ Did you forget to add hosts?',
                    '→ No hosts found',
                ]),
            );

            return formattedHosts;
        }

        const publicKeyMap = await resolveInboundAndPublicKey(hosts.map((host) => host.rawInbound));

        for (const inputHost of hosts) {
            const remark = TemplateEngine.formatWithUser(
                inputHost.remark,
                user,
                this.subPublicDomain,
            );

            const inbound = inputHost.rawInbound as InboundObject;

            let address = inputHost.address;

            if (address.includes(',')) {
                const addressList = address.split(',');
                address = addressList[Math.floor(Math.random() * addressList.length)].trim();
            }

            const port = inputHost.port;
            let network = inbound.streamSettings?.network || 'tcp';

            let streamSettings: WebSocketObject | xHttpObject | RawObject | TcpObject | undefined;
            let pathFromConfig: string | undefined;
            let hostFromConfig: string | undefined;
            let additionalParams: IFormattedHost['additionalParams'] | undefined;
            let headerType: string | undefined;
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
                case 'raw': {
                    const settings = inbound.streamSettings?.rawSettings as RawObject;

                    streamSettings = settings;
                    headerType = settings?.header?.type;

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
                    headerType = settings?.header?.type;

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

            const host = inputHost.host || hostFromConfig || '';

            const tls = tlsFromConfig;

            const isDomain = (str: string): boolean => {
                const domainRegex =
                    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
                return domainRegex.test(str);
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

            formattedHosts.push({
                remark,
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
                headerType,
                spiderX,
                network,
                password: {
                    trojanPassword: user.trojanPassword,
                    vlessPassword: user.vlessUuid,
                    ssPassword: user.ssPassword,
                },
                additionalParams,
                xHttpExtraParams,
                serverDescription,
                muxParams,
                sockoptParams,
            });
        }

        return formattedHosts;
    }

    private async getSubscriptionSettings(): Promise<SubscriptionSettingsEntity | null> {
        const settingsResponse = await this.queryBus.execute<
            GetSubscriptionSettingsQuery,
            ICommandResponse<SubscriptionSettingsEntity>
        >(new GetSubscriptionSettingsQuery());

        if (!settingsResponse.isOk || !settingsResponse.response) {
            return null;
        }

        return settingsResponse.response;
    }

    private createFallbackHosts(remarks: string[]): IFormattedHost[] {
        return remarks.map((remark) => ({
            remark,
            address: '0.0.0.0',
            port: 1,
            protocol: 'trojan',
            path: '',
            host: '',
            tls: 'tls',
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
        }));
    }
}
