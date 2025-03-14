import { randomUUID } from 'node:crypto';
import dayjs from 'dayjs';

import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import {
    StreamSettingsObject,
    TcpObject,
    WebSocketObject,
    xHttpObject,
} from '@common/helpers/xray-config/interfaces/transport.config';
import { RawObject } from '@common/helpers/xray-config/interfaces/transport.config';
import { TemplateEngine } from '@common/utils/templates/replace-templates-values';
import { XRayConfig } from '@common/helpers/xray-config/xray-config.validator';
import { prettyBytesUtil } from '@common/utils/bytes/pretty-bytes.util';
import { ICommandResponse } from '@common/types/command-response.type';
import { USER_STATUSES_TEMPLATE } from '@libs/contracts/constants/templates/user-statuses';
import { USERS_STATUS } from '@libs/contracts/constants';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities/subscription-settings.entity';
import { GetSubscriptionSettingsQuery } from '@modules/subscription-settings/queries/get-subscription-settings';
import { UserWithActiveInboundsEntity } from '@modules/users/entities/user-with-active-inbounds.entity';
import { HostWithInboundTagEntity } from '@modules/hosts/entities/host-with-inbound-tag.entity';

import { IFormattedHost } from './interfaces/formatted-hosts.interface';

@Injectable()
export class FormatHostsService {
    constructor(private readonly queryBus: QueryBus) {}

    public async generateFormattedHosts(
        config: XRayConfig,
        hosts: HostWithInboundTagEntity[],
        user: UserWithActiveInboundsEntity,
    ): Promise<IFormattedHost[]> {
        const formattedHosts: IFormattedHost[] = [];

        let specialRemarks: string[] = [];

        if (user.status !== USERS_STATUS.ACTIVE) {
            const settings = await this.getSubscriptionSettings();
            if (!settings) {
                return formattedHosts;
            }

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

            specialRemarks.forEach((remark) => {
                formattedHosts.push({
                    remark,
                    address: '0.0.0.0',
                    port: 0,
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
                });
            });

            return formattedHosts;
        }

        for (const inputHost of hosts) {
            const inbound = config.getInbound(inputHost.inboundTag.tag);

            if (!inbound) {
                continue;
            }

            const remark = TemplateEngine.replace(inputHost.remark, {
                DAYS_LEFT: dayjs(user.expireAt).diff(dayjs(), 'day'),
                TRAFFIC_USED: prettyBytesUtil(user.usedTrafficBytes, true, 3),
                TRAFFIC_LEFT: prettyBytesUtil(
                    user.trafficLimitBytes - user.usedTrafficBytes,
                    true,
                    3,
                ),
                TOTAL_TRAFFIC: prettyBytesUtil(user.trafficLimitBytes, true, 3),
                STATUS: USER_STATUSES_TEMPLATE[user.status],
            });

            const address = inputHost.address;
            const port = inputHost.port;
            const network = inbound.streamSettings?.network || 'tcp';

            let streamSettings: WebSocketObject | xHttpObject | RawObject | TcpObject | undefined;
            let pathFromConfig: string | undefined;
            let hostFromConfig: string | undefined;
            let additionalParams: IFormattedHost['additionalParams'] | undefined;
            let headerType: string | undefined;

            switch (network) {
                case 'xhttp': {
                    const settings = inbound.streamSettings?.xhttpSettings as xHttpObject;
                    streamSettings = settings;
                    pathFromConfig = settings?.path;
                    hostFromConfig = settings?.host;
                    additionalParams = {
                        scMaxEachPostBytes: settings?.extra?.scMaxEachPostBytes || 1000000,
                        scMaxBufferedPosts: settings?.extra?.scMaxBufferedPosts || 1000000,
                        scMaxConcurrentPosts: settings?.extra?.scMaxConcurrentPosts || 100,
                        scMinPostsIntervalMs: settings?.extra?.scMinPostsIntervalMs || 30,
                        xPaddingBytes: settings?.extra?.xPaddingBytes || '100-1000',
                        noGRPCHeader: settings?.extra?.noGRPCHeader || false,
                        heartbeatPeriod: settings?.extra?.heartbeatPeriod || undefined,
                        mode: settings?.mode || 'auto',
                    };

                    break;
                }
                case 'ws': {
                    const settings = inbound.streamSettings?.wsSettings as WebSocketObject;
                    streamSettings = settings;
                    pathFromConfig = settings?.path;
                    break;
                }
                case 'raw':
                    streamSettings = inbound.streamSettings?.rawSettings as RawObject;
                    break;
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
                    alpnFromConfig = tlsSettings?.alpn?.join(',');
                    break;
                case 'reality':
                    tlsFromConfig = 'reality';
                    const realitySettings = inbound.streamSettings?.realitySettings;
                    sniFromConfig = realitySettings?.serverNames?.[0];
                    fingerprintFromConfig = realitySettings?.fingerprint;

                    // TODO: Implement public key generation

                    // try {
                    //     const configPrivateKey = realitySettings!.privateKey;

                    //     for (let i = 0; i < 100; i++) {
                    //         console.time('genPublicKeyNodeCrypto');
                    //         const { publicKey } = this.createX25519KeyPairFromBase64(
                    //             configPrivateKey!,
                    //         );
                    //         const base64PublicKey = publicKey
                    //             .export({
                    //                 format: 'der',
                    //                 type: 'spki',
                    //             })
                    //             .toString('base64url');

                    //         console.timeEnd('genPublicKeyNodeCrypto');
                    //     }
                    // } catch (error) {
                    //     console.log(error);
                    // }

                    publicKeyFromConfig = realitySettings?.publicKey;

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

            const fp = inputHost.fingerprint || fingerprintFromConfig || '';

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
}
