import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';

import { TemplateEngine } from '@common/utils/templates/replace-templates-values';
import { prettyBytesUtil } from '@common/utils/bytes/pretty-bytes.util';
import { ICommandResponse } from '@common/types/command-response.type';
import { HwidHeaders } from '@common/utils/extract-hwid-headers';
import { XRayConfig } from '@common/helpers/xray-config';
import { createHappCryptoLink } from '@common/utils';
import {
    ERRORS,
    REQUEST_TEMPLATE_TYPE,
    SUBSCRIPTION_TEMPLATE_TYPE,
    TRequestTemplateTypeKeys,
    TSubscriptionTemplateType,
    USERS_STATUS,
} from '@libs/contracts/constants';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities/subscription-settings.entity';
import { GetSubscriptionSettingsQuery } from '@modules/subscription-settings/queries/get-subscription-settings';
import { UpsertHwidUserDeviceCommand } from '@modules/hwid-user-devices/commands/upsert-hwid-user-device';
import { XrayGeneratorService } from '@modules/subscription-template/generators/xray.generator.service';
import { FormatHostsService } from '@modules/subscription-template/generators/format-hosts.service';
import { HwidUserDeviceEntity } from '@modules/hwid-user-devices/entities/hwid-user-device.entity';
import { RenderTemplatesService } from '@modules/subscription-template/render-templates.service';
import { CountUsersDevicesQuery } from '@modules/hwid-user-devices/queries/count-users-devices';
import { GetUsersWithPaginationQuery } from '@modules/users/queries/get-users-with-pagination';
import { CheckHwidExistsQuery } from '@modules/hwid-user-devices/queries/check-hwid-exists';
import { IFormattedHost } from '@modules/subscription-template/generators/interfaces';
import { GetUserByUsernameQuery } from '@modules/users/queries/get-user-by-username';

import {
    SubscriptionNotFoundResponse,
    SubscriptionRawResponse,
    SubscriptionWithConfigResponse,
} from './models';
import { UpdateSubLastOpenedAndUserAgentCommand } from '../users/commands/update-sub-last-opened-and-user-agent';
import { UserWithActiveInboundsEntity } from '../users/entities/user-with-active-inbounds.entity';
import { HostWithInboundTagEntity } from '../hosts/entities/host-with-inbound-tag.entity';
import { GetValidatedConfigQuery } from '../xray-config/queries/get-validated-config';
import { ISubscriptionHeaders } from './interfaces/subscription-headers.interface';
import { GetUserByShortUuidQuery } from '../users/queries/get-user-by-short-uuid';
import { GetHostsForUserQuery } from '../hosts/queries/get-hosts-for-user';
import { getSubscriptionUserInfo } from './utils/get-user-info.headers';
import { GetAllSubscriptionsQueryDto } from './dto';

@Injectable()
export class SubscriptionService {
    private readonly logger = new Logger(SubscriptionService.name);

    private readonly hwidDeviceLimitEnabled: boolean;

    private readonly subPublicDomain: string;

    constructor(
        private readonly queryBus: QueryBus,
        private readonly configService: ConfigService,
        private readonly commandBus: CommandBus,
        private readonly renderTemplatesService: RenderTemplatesService,
        private readonly formatHostsService: FormatHostsService,
        private readonly xrayGeneratorService: XrayGeneratorService,
    ) {
        this.hwidDeviceLimitEnabled =
            this.configService.getOrThrow<string>('HWID_DEVICE_LIMIT_ENABLED') === 'true';
        this.subPublicDomain = this.configService.getOrThrow<string>('SUB_PUBLIC_DOMAIN');
    }

    public async getSubscriptionByShortUuid(
        shortUuid: string,
        userAgent: string,
        isHtml: boolean,
        clientType: TRequestTemplateTypeKeys | undefined,
        hwidHeaders: HwidHeaders | null,
    ): Promise<
        SubscriptionNotFoundResponse | SubscriptionRawResponse | SubscriptionWithConfigResponse
    > {
        try {
            const user = await this.getUserByShortUuid({ shortUuid });
            if (!user.isOk || !user.response) {
                return new SubscriptionNotFoundResponse();
            }

            const settings = await this.getSubscriptionSettings();

            if (!settings.isOk || !settings.response) {
                return new SubscriptionNotFoundResponse();
            }

            const settingEntity = settings.response;

            if (this.hwidDeviceLimitEnabled) {
                const isAllowed = await this.checkHwidDeviceLimit(user.response, hwidHeaders);

                if (
                    isAllowed.isOk &&
                    isAllowed.response &&
                    !isAllowed.response.isSubscriptionAllowed
                ) {
                    const response = new SubscriptionWithConfigResponse({
                        headers: await this.getUserProfileHeadersInfo(
                            user.response,
                            /^Happ\//.test(userAgent),
                            settingEntity,
                        ),
                        body: '',
                        contentType: 'text/plain',
                    });

                    response.headers.announce = `base64:${Buffer.from(
                        this.configService.getOrThrow<string>('HWID_MAX_DEVICES_ANNOUNCE'),
                    ).toString('base64')}`;

                    return response;
                }
            } else {
                await this.checkAndUpsertHwidUserDevice(user.response, hwidHeaders);
            }

            let clientOverride: TSubscriptionTemplateType | undefined;

            switch (clientType) {
                case REQUEST_TEMPLATE_TYPE.STASH:
                    clientOverride = SUBSCRIPTION_TEMPLATE_TYPE.STASH;
                    break;
                case REQUEST_TEMPLATE_TYPE.SINGBOX:
                    clientOverride = SUBSCRIPTION_TEMPLATE_TYPE.SINGBOX;
                    break;
                case REQUEST_TEMPLATE_TYPE.SINGBOX_LEGACY:
                    clientOverride = SUBSCRIPTION_TEMPLATE_TYPE.SINGBOX_LEGACY;
                    break;
                case REQUEST_TEMPLATE_TYPE.MIHOMO:
                    clientOverride = SUBSCRIPTION_TEMPLATE_TYPE.MIHOMO;
                    break;
                case REQUEST_TEMPLATE_TYPE.XRAY_JSON:
                case REQUEST_TEMPLATE_TYPE.V2RAY_JSON:
                    clientOverride = SUBSCRIPTION_TEMPLATE_TYPE.XRAY_JSON;
                    break;
                case REQUEST_TEMPLATE_TYPE.CLASH:
                    clientOverride = SUBSCRIPTION_TEMPLATE_TYPE.CLASH;
                    break;
                default:
                    clientOverride = undefined;
                    break;
            }

            if (isHtml) {
                const result = await this.getSubscriptionInfoByShortUuid(
                    user.response.shortUuid,
                    settingEntity,
                );
                if (!result.isOk || !result.response) {
                    return new SubscriptionNotFoundResponse();
                }
                return result.response;
            }

            const hosts = await this.getHostsByUserUuid({ userUuid: user.response.uuid });

            if (!hosts.isOk || !hosts.response) {
                return new SubscriptionNotFoundResponse();
            }

            const config = await this.getValidatedConfig();
            if (!config) {
                return new SubscriptionNotFoundResponse();
            }

            await this.updateSubLastOpenedAndUserAgent({
                userUuid: user.response.uuid,
                subLastOpenedAt: new Date(),
                subLastUserAgent: userAgent,
            });

            let subscription: { contentType: string; sub: string };

            if (
                clientOverride !== undefined &&
                clientOverride !== SUBSCRIPTION_TEMPLATE_TYPE.XRAY_JSON
            ) {
                subscription = await this.renderTemplatesService.generateSubscriptionByClientType({
                    userAgent,
                    user: user.response,
                    hosts: hosts.response,
                    config,
                    clientType: clientOverride,
                });
            } else {
                let isServeJson = clientOverride === SUBSCRIPTION_TEMPLATE_TYPE.XRAY_JSON;

                if (!isServeJson && settingEntity.serveJsonAtBaseSubscription) {
                    isServeJson = true;
                }

                subscription = await this.renderTemplatesService.generateSubscription({
                    userAgent: userAgent,
                    user: user.response,
                    config,
                    hosts: hosts.response,
                    isOutlineConfig: false,
                    needJsonSubscription: isServeJson,
                });
            }

            return new SubscriptionWithConfigResponse({
                headers: await this.getUserProfileHeadersInfo(
                    user.response,
                    /^Happ\//.test(userAgent),
                    settingEntity,
                ),
                body: subscription.sub,
                contentType: subscription.contentType,
            });
        } catch (error) {
            this.logger.error(error);
            return new SubscriptionNotFoundResponse();
        }
    }

    public async getOutlineSubscriptionByShortUuid(
        shortUuid: string,
        userAgent: string,
        isHtml: boolean,
        isOutlineConfig: boolean = false,
        encodedTag?: string,
    ): Promise<
        SubscriptionNotFoundResponse | SubscriptionRawResponse | SubscriptionWithConfigResponse
    > {
        try {
            const user = await this.getUserByShortUuid({ shortUuid });
            if (!user.isOk || !user.response) {
                return new SubscriptionNotFoundResponse();
            }

            const settings = await this.getSubscriptionSettings();

            if (!settings.isOk || !settings.response) {
                return new SubscriptionNotFoundResponse();
            }

            const settingEntity = settings.response;

            if (isHtml) {
                const result = await this.getSubscriptionInfoByShortUuid(user.response.shortUuid);
                if (!result.isOk || !result.response) {
                    return new SubscriptionNotFoundResponse();
                }
                return result.response;
            }

            const hosts = await this.getHostsByUserUuid({ userUuid: user.response.uuid });

            if (!hosts.isOk || !hosts.response) {
                return new SubscriptionNotFoundResponse();
            }

            const config = await this.getValidatedConfig();
            if (!config) {
                return new SubscriptionNotFoundResponse();
            }

            await this.updateSubLastOpenedAndUserAgent({
                userUuid: user.response.uuid,
                subLastOpenedAt: new Date(),
                subLastUserAgent: userAgent,
            });

            const subscription = await this.renderTemplatesService.generateSubscription({
                userAgent: userAgent,
                user: user.response,
                config,
                hosts: hosts.response,
                isOutlineConfig,
                encodedTag,
            });

            return new SubscriptionWithConfigResponse({
                headers: await this.getUserProfileHeadersInfo(
                    user.response,
                    /^Happ\//.test(userAgent),
                    settingEntity,
                ),
                body: subscription.sub,
                contentType: subscription.contentType,
            });
        } catch {
            return new SubscriptionNotFoundResponse();
        }
    }

    public async getSubscriptionInfoByShortUuid(
        shortUuid: string,
        settingEntity?: SubscriptionSettingsEntity,
    ): Promise<ICommandResponse<SubscriptionRawResponse>> {
        try {
            const user = await this.getUserByShortUuid({ shortUuid });
            if (!user.isOk || !user.response) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const config = await this.getValidatedConfig();
            if (!config) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SERVER_ERROR,
                };
            }

            const hosts = await this.getHostsByUserUuid({ userUuid: user.response.uuid });

            const formattedHosts = await this.formatHostsService.generateFormattedHosts(
                config,
                hosts.response || [],
                user.response,
            );

            const xrayLinks = this.xrayGeneratorService.generateLinks(formattedHosts);

            const ssConfLinks = await this.generateSsConfLinks(
                user.response.shortUuid,
                formattedHosts,
            );

            let settings: SubscriptionSettingsEntity;
            if (!settingEntity) {
                const settingsResponse = await this.getSubscriptionSettings();

                if (!settingsResponse.isOk || !settingsResponse.response) {
                    return {
                        isOk: false,
                        ...ERRORS.INTERNAL_SERVER_ERROR,
                    };
                }

                settings = settingsResponse.response;
            } else {
                settings = settingEntity;
            }

            return {
                isOk: true,
                response: await this.getUserInfo(user.response, xrayLinks, ssConfLinks, settings),
            };
        } catch (error) {
            this.logger.error(`Error getting subscription info by short uuid: ${error}`);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    private async getUserInfo(
        user: UserWithActiveInboundsEntity,
        links: string[],
        ssConfLinks: Record<string, string>,
        settingEntity: SubscriptionSettingsEntity,
    ): Promise<SubscriptionRawResponse> {
        const subscriptionUrl = settingEntity.addUsernameToBaseSubscription
            ? `https://${this.configService.getOrThrow('SUB_PUBLIC_DOMAIN')}/${user.shortUuid}#${user.username}`
            : `https://${this.configService.getOrThrow('SUB_PUBLIC_DOMAIN')}/${user.shortUuid}`;

        return new SubscriptionRawResponse({
            isFound: true,
            user: {
                shortUuid: user.shortUuid,
                daysLeft: dayjs(user.expireAt).diff(dayjs(), 'day'),
                trafficUsed: prettyBytesUtil(user.usedTrafficBytes),
                trafficLimit: prettyBytesUtil(user.trafficLimitBytes),
                username: user.username,
                expiresAt: user.expireAt,
                isActive: user.status === USERS_STATUS.ACTIVE,
                userStatus: user.status,
                trafficLimitStrategy: user.trafficLimitStrategy,
            },
            links,
            ssConfLinks,
            subscriptionUrl,
            happ: {
                cryptoLink: createHappCryptoLink(subscriptionUrl),
            },
        });
    }

    public async getAllSubscriptions(query: GetAllSubscriptionsQueryDto): Promise<
        ICommandResponse<{
            total: number;
            subscriptions: SubscriptionRawResponse[];
        }>
    > {
        try {
            const { start, size } = query;

            const usersResponse = await this.getUsersWithPagination({ start, size });

            if (!usersResponse.isOk || !usersResponse.response) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SERVER_ERROR,
                };
            }

            const users = usersResponse.response.users;
            const total = usersResponse.response.total;

            const config = await this.getValidatedConfig();
            if (!config) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SERVER_ERROR,
                };
            }

            const settingsResponse = await this.getSubscriptionSettings();

            if (!settingsResponse.isOk || !settingsResponse.response) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SERVER_ERROR,
                };
            }

            const settings = settingsResponse.response;

            const subscriptions: SubscriptionRawResponse[] = [];

            for (const user of users) {
                const hosts = await this.getHostsByUserUuid({ userUuid: user.uuid });
                const formattedHosts = await this.formatHostsService.generateFormattedHosts(
                    config,
                    hosts.response || [],
                    user,
                );

                const xrayLinks = this.xrayGeneratorService.generateLinks(formattedHosts);

                const ssConfLinks = await this.generateSsConfLinks(user.shortUuid, formattedHosts);

                subscriptions.push(await this.getUserInfo(user, xrayLinks, ssConfLinks, settings));
            }

            return {
                isOk: true,
                response: {
                    total,
                    subscriptions,
                },
            };
        } catch (error) {
            this.logger.error(`Error getting subscription info by short uuid: ${error}`);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    public async getSubscriptionByUsername(
        username: string,
    ): Promise<ICommandResponse<SubscriptionRawResponse>> {
        try {
            const user = await this.getUserByUsername({ username });

            if (!user.isOk || !user.response) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const result = await this.getSubscriptionInfoByShortUuid(user.response.shortUuid);

            if (!result.isOk || !result.response) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SERVER_ERROR,
                };
            }

            return {
                isOk: true,
                response: result.response,
            };
        } catch (error) {
            this.logger.error(`Error getting subscription by username: ${error}`);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    private async generateSsConfLinks(
        subscriptionShortUuid: string,
        formattedHosts: IFormattedHost[],
    ): Promise<Record<string, string>> {
        const publicDomain = this.configService.getOrThrow('SUB_PUBLIC_DOMAIN');
        const links: Record<string, string> = {};

        for (const host of formattedHosts) {
            if (host.protocol !== 'shadowsocks' || host.port === 0 || host.port === 1) {
                continue;
            }

            links[host.remark] =
                `ssconf://${publicDomain}/${subscriptionShortUuid}/ss/${Buffer.from(
                    host.remark,
                ).toString('base64url')}#${host.remark}`;
        }

        return links;
    }

    private async getUserProfileHeadersInfo(
        user: UserWithActiveInboundsEntity,
        isHapp: boolean,
        settings: SubscriptionSettingsEntity,
    ): Promise<ISubscriptionHeaders> {
        const headers: ISubscriptionHeaders = {
            'content-disposition': `attachment; filename="${user.username}"`,
            'support-url': settings.supportLink,
            'profile-title': `base64:${Buffer.from(
                TemplateEngine.formarWithUser(settings.profileTitle, user, this.subPublicDomain),
            ).toString('base64')}`,
            'profile-update-interval': settings.profileUpdateInterval.toString(),
            'subscription-userinfo': Object.entries(getSubscriptionUserInfo(user))
                .map(([key, val]) => `${key}=${val}`)
                .join('; '),
        };

        if (settings.happAnnounce) {
            headers.announce = `base64:${Buffer.from(
                TemplateEngine.formarWithUser(settings.happAnnounce, user, this.subPublicDomain),
            ).toString('base64')}`;
        }

        if (isHapp && settings.happRouting) {
            headers.routing = settings.happRouting;
        }

        if (settings.isProfileWebpageUrlEnabled && !this.hwidDeviceLimitEnabled) {
            headers['profile-web-page-url'] = `https://${this.subPublicDomain}/${user.shortUuid}`;
        }

        if (isHapp && this.hwidDeviceLimitEnabled) {
            const providerId = this.configService.get<string>('PROVIDER_ID');
            if (providerId) {
                headers.providerid = providerId;
            }
        }

        if (settings.customResponseHeaders) {
            for (const [key, value] of Object.entries(settings.customResponseHeaders)) {
                headers[key] = TemplateEngine.formarWithUser(value, user, this.subPublicDomain);
            }
        }

        return headers;
    }

    private async getUserByShortUuid(
        dto: GetUserByShortUuidQuery,
    ): Promise<ICommandResponse<UserWithActiveInboundsEntity>> {
        return this.queryBus.execute<
            GetUserByShortUuidQuery,
            ICommandResponse<UserWithActiveInboundsEntity>
        >(new GetUserByShortUuidQuery(dto.shortUuid));
    }

    private async getUserByUsername(
        dto: GetUserByUsernameQuery,
    ): Promise<ICommandResponse<UserWithActiveInboundsEntity>> {
        return this.queryBus.execute<
            GetUserByUsernameQuery,
            ICommandResponse<UserWithActiveInboundsEntity>
        >(new GetUserByUsernameQuery(dto.username));
    }

    private async getUsersWithPagination(
        dto: GetUsersWithPaginationQuery,
    ): Promise<ICommandResponse<{ users: UserWithActiveInboundsEntity[]; total: number }>> {
        return this.queryBus.execute<
            GetUsersWithPaginationQuery,
            ICommandResponse<{ users: UserWithActiveInboundsEntity[]; total: number }>
        >(new GetUsersWithPaginationQuery(dto.start, dto.size));
    }

    private async getHostsByUserUuid(
        dto: GetHostsForUserQuery,
    ): Promise<ICommandResponse<HostWithInboundTagEntity[]>> {
        return this.queryBus.execute<
            GetHostsForUserQuery,
            ICommandResponse<HostWithInboundTagEntity[]>
        >(new GetHostsForUserQuery(dto.userUuid));
    }

    private async getValidatedConfig(): Promise<null | XRayConfig> {
        return this.queryBus.execute<GetValidatedConfigQuery, null | XRayConfig>(
            new GetValidatedConfigQuery(),
        );
    }

    private async getSubscriptionSettings(): Promise<ICommandResponse<SubscriptionSettingsEntity>> {
        return this.queryBus.execute<
            GetSubscriptionSettingsQuery,
            ICommandResponse<SubscriptionSettingsEntity>
        >(new GetSubscriptionSettingsQuery());
    }

    private async updateSubLastOpenedAndUserAgent(
        dto: UpdateSubLastOpenedAndUserAgentCommand,
    ): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<
            UpdateSubLastOpenedAndUserAgentCommand,
            ICommandResponse<void>
        >(
            new UpdateSubLastOpenedAndUserAgentCommand(
                dto.userUuid,
                dto.subLastOpenedAt,
                dto.subLastUserAgent,
            ),
        );
    }

    private async countHwidUserDevices(
        dto: CountUsersDevicesQuery,
    ): Promise<ICommandResponse<number>> {
        return this.queryBus.execute<CountUsersDevicesQuery, ICommandResponse<number>>(
            new CountUsersDevicesQuery(dto.userUuid),
        );
    }

    private async checkHwidDeviceExists(
        dto: CheckHwidExistsQuery,
    ): Promise<ICommandResponse<{ exists: boolean }>> {
        return this.queryBus.execute<CheckHwidExistsQuery, ICommandResponse<{ exists: boolean }>>(
            new CheckHwidExistsQuery(dto.hwid, dto.userUuid),
        );
    }

    private async upsertHwidUserDevice(
        dto: UpsertHwidUserDeviceCommand,
    ): Promise<ICommandResponse<HwidUserDeviceEntity>> {
        return this.commandBus.execute<
            UpsertHwidUserDeviceCommand,
            ICommandResponse<HwidUserDeviceEntity>
        >(new UpsertHwidUserDeviceCommand(dto.hwidUserDevice));
    }

    private async checkHwidDeviceLimit(
        user: UserWithActiveInboundsEntity,
        hwidHeaders: HwidHeaders | null,
    ): Promise<
        ICommandResponse<{
            isSubscriptionAllowed: boolean;
        }>
    > {
        try {
            if (user.hwidDeviceLimit === 0) {
                return {
                    isOk: true,
                    response: {
                        isSubscriptionAllowed: true,
                    },
                };
            }

            if (hwidHeaders === null) {
                return {
                    isOk: true,
                    response: {
                        isSubscriptionAllowed: false,
                    },
                };
            }

            const hwidGlobalDeviceLimit = this.configService.getOrThrow<number>(
                'HWID_FALLBACK_DEVICE_LIMIT',
            );

            const isDeviceExists = await this.checkHwidDeviceExists({
                hwid: hwidHeaders.hwid,
                userUuid: user.uuid,
            });

            if (isDeviceExists.isOk && isDeviceExists.response) {
                if (isDeviceExists.response.exists) {
                    await this.upsertHwidUserDevice({
                        hwidUserDevice: new HwidUserDeviceEntity({
                            hwid: hwidHeaders.hwid,
                            userUuid: user.uuid,
                            platform: hwidHeaders.platform,
                            osVersion: hwidHeaders.osVersion,
                            deviceModel: hwidHeaders.deviceModel,
                            userAgent: hwidHeaders.userAgent,
                        }),
                    });

                    return {
                        isOk: true,
                        response: {
                            isSubscriptionAllowed: true,
                        },
                    };
                }
            }

            const count = await this.countHwidUserDevices({ userUuid: user.uuid });

            const deviceLimit = user.hwidDeviceLimit ?? hwidGlobalDeviceLimit;

            if (!count.isOk || count.response === undefined) {
                return {
                    isOk: true,
                    response: {
                        isSubscriptionAllowed: false,
                    },
                };
            }

            if (count.response >= deviceLimit) {
                return {
                    isOk: true,
                    response: {
                        isSubscriptionAllowed: false,
                    },
                };
            }

            const result = await this.upsertHwidUserDevice({
                hwidUserDevice: new HwidUserDeviceEntity({
                    hwid: hwidHeaders.hwid,
                    userUuid: user.uuid,
                    platform: hwidHeaders.platform,
                    osVersion: hwidHeaders.osVersion,
                    deviceModel: hwidHeaders.deviceModel,
                    userAgent: hwidHeaders.userAgent,
                }),
            });

            if (!result.isOk || !result.response) {
                this.logger.error(`Error creating Hwid user device, access forbidden.`);
                return {
                    isOk: false,
                    response: {
                        isSubscriptionAllowed: false,
                    },
                };
            }

            return {
                isOk: true,
                response: {
                    isSubscriptionAllowed: true,
                },
            };
        } catch (error) {
            this.logger.error(`Error checking hwid device limit: ${error}`);
            return {
                isOk: false,
                response: {
                    isSubscriptionAllowed: false,
                },
            };
        }
    }

    private async checkAndUpsertHwidUserDevice(
        user: UserWithActiveInboundsEntity,
        hwidHeaders: HwidHeaders | null,
    ): Promise<void> {
        try {
            if (hwidHeaders === null) {
                return;
            }

            await this.upsertHwidUserDevice({
                hwidUserDevice: new HwidUserDeviceEntity({
                    hwid: hwidHeaders.hwid,
                    userUuid: user.uuid,
                    platform: hwidHeaders.platform,
                    osVersion: hwidHeaders.osVersion,
                    deviceModel: hwidHeaders.deviceModel,
                    userAgent: hwidHeaders.userAgent,
                }),
            });
        } catch (error) {
            this.logger.error(`Error upserting hwid user device: ${error}`);

            return;
        }
    }
}
