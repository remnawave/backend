import { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import pMap from 'p-map';
import _ from 'lodash';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';

import { TemplateEngine } from '@common/utils/templates/replace-templates-values';
import { prettyBytesUtil } from '@common/utils/bytes/pretty-bytes.util';
import { ICommandResponse } from '@common/types/command-response.type';
import { HwidHeaders } from '@common/utils/extract-hwid-headers';
import { createHappCryptoLink } from '@common/utils';
import {
    CACHE_KEYS,
    ERRORS,
    EVENTS,
    RESPONSE_RULES_RESPONSE_TYPES,
    TSubscriptionTemplateType,
    USERS_STATUS,
} from '@libs/contracts/constants';

import { UserHwidDeviceEvent } from '@integration-modules/notifications/interfaces';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities/subscription-settings.entity';
import { GetSubscriptionSettingsQuery } from '@modules/subscription-settings/queries/get-subscription-settings';
import { GetExternalSquadSettingsQuery } from '@modules/external-squads/queries/get-external-squad-settings';
import { UpsertHwidUserDeviceCommand } from '@modules/hwid-user-devices/commands/upsert-hwid-user-device';
import { XrayGeneratorService } from '@modules/subscription-template/generators/xray.generator.service';
import { FormatHostsService } from '@modules/subscription-template/generators/format-hosts.service';
import { HwidUserDeviceEntity } from '@modules/hwid-user-devices/entities/hwid-user-device.entity';
import { RenderTemplatesService } from '@modules/subscription-template/render-templates.service';
import { CountUsersDevicesQuery } from '@modules/hwid-user-devices/queries/count-users-devices';
import { IFormattedHost, IRawHost } from '@modules/subscription-template/generators/interfaces';
import { GetUsersWithPaginationQuery } from '@modules/users/queries/get-users-with-pagination';
import { ExternalSquadEntity } from '@modules/external-squads/entities/external-squad.entity';
import { CheckHwidExistsQuery } from '@modules/hwid-user-devices/queries/check-hwid-exists';
import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';
import { GetTemplateNameQuery } from '@modules/external-squads/queries/get-template-name';
import { ISRRContext } from '@modules/subscription-response-rules/interfaces';
import { UserEntity } from '@modules/users/entities/user.entity';
import { GetUserResponseModel } from '@modules/users/models';

import { UserSubscriptionRequestHistoryQueueService } from '@queue/user-subscription-request-history/user-subscription-request-history.service';

import {
    RawSubscriptionWithHostsResponse,
    SubscriptionNotFoundResponse,
    SubscriptionRawResponse,
    SubscriptionWithConfigResponse,
} from './models';
import { UpdateSubLastOpenedAndUserAgentCommand } from '../users/commands/update-sub-last-opened-and-user-agent';
import { getSubscriptionRefillDate, getSubscriptionUserInfo } from './utils/get-user-info.headers';
import { HostWithRawInbound } from '../hosts/entities/host-with-inbound-tag.entity';
import { ISubscriptionHeaders } from './interfaces/subscription-headers.interface';
import { GetHostsForUserQuery } from '../hosts/queries/get-hosts-for-user';
import { GetAllSubscriptionsQueryDto } from './dto';

@Injectable()
export class SubscriptionService {
    private readonly logger = new Logger(SubscriptionService.name);
    private readonly hwidDeviceLimitEnabled: boolean;
    private readonly subPublicDomain: string;
    private readonly hwidFallbackDeviceLimit: number | undefined;

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly queryBus: QueryBus,
        private readonly configService: ConfigService,
        private readonly commandBus: CommandBus,
        private readonly eventEmitter: EventEmitter2,
        private readonly renderTemplatesService: RenderTemplatesService,
        private readonly formatHostsService: FormatHostsService,
        private readonly xrayGeneratorService: XrayGeneratorService,
        private readonly userSubscriptionRequestHistoryQueue: UserSubscriptionRequestHistoryQueueService,
    ) {
        this.hwidDeviceLimitEnabled =
            this.configService.getOrThrow<string>('HWID_DEVICE_LIMIT_ENABLED') === 'true';
        this.subPublicDomain = this.configService.getOrThrow<string>('SUB_PUBLIC_DOMAIN');
        this.hwidFallbackDeviceLimit = this.configService.get<number | undefined>(
            'HWID_FALLBACK_DEVICE_LIMIT',
        );
    }

    public async getSubscriptionByShortUuid(
        srrContext: ISRRContext,
        shortUuid: string,
    ): Promise<
        SubscriptionNotFoundResponse | SubscriptionRawResponse | SubscriptionWithConfigResponse
    > {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        shortUuid,
                    },
                    {
                        activeInternalSquads: false,
                        lastConnectedNode: false,
                    },
                ),
            );
            if (!user.isOk || !user.response) {
                return new SubscriptionNotFoundResponse();
            }

            const { userAgent, hwidHeaders, matchedResponseType, isXrayExtSupported } = srrContext;

            if (!srrContext.overrideTemplateName) {
                if (user.response.externalSquadUuid) {
                    let templateTypeMatcher = matchedResponseType as TSubscriptionTemplateType;

                    if (matchedResponseType === 'XRAY_BASE64') {
                        // In case if XRAY_BASE64 matched as fallback
                        templateTypeMatcher = 'XRAY_JSON';
                    }

                    const templateName = await this.queryBus.execute(
                        new GetTemplateNameQuery(
                            user.response.externalSquadUuid,
                            templateTypeMatcher,
                        ),
                    );

                    if (templateName.isOk && templateName.response) {
                        srrContext.overrideTemplateName = templateName.response;
                    }
                }
            }

            let hostsOverrides: ExternalSquadEntity['hostOverrides'] | undefined;
            // Override subscription settings with External Squad subscription settings
            if (user.response.externalSquadUuid) {
                const externalSquadSubscriptionSettings = await this.queryBus.execute(
                    new GetExternalSquadSettingsQuery(user.response.externalSquadUuid),
                );

                if (
                    externalSquadSubscriptionSettings.isOk &&
                    externalSquadSubscriptionSettings.response
                ) {
                    if (externalSquadSubscriptionSettings.response.subscriptionSettings !== null) {
                        srrContext.subscriptionSettings = {
                            ...srrContext.subscriptionSettings,
                            ...externalSquadSubscriptionSettings.response.subscriptionSettings,
                        };
                    }

                    if (externalSquadSubscriptionSettings.response.hostOverrides !== null) {
                        hostsOverrides = externalSquadSubscriptionSettings.response.hostOverrides;
                    }

                    if (
                        externalSquadSubscriptionSettings.response.responseHeaders !== null &&
                        Object.keys(externalSquadSubscriptionSettings.response.responseHeaders)
                            .length > 0
                    ) {
                        srrContext.subscriptionSettings.customResponseHeaders =
                            externalSquadSubscriptionSettings.response.responseHeaders;
                    }
                }
            }

            const subscriptionSettings = srrContext.subscriptionSettings;

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
                            isXrayExtSupported,
                            subscriptionSettings,
                        ),
                        body: '',
                        contentType: 'text/plain',
                    });

                    response.headers.announce = `base64:${Buffer.from(
                        this.configService.getOrThrow<string>('HWID_MAX_DEVICES_ANNOUNCE'),
                    ).toString('base64')}`;
                    response.headers['x-hwid-limit'] = 'true'; // v2rayTUN

                    return response;
                }
            } else {
                await this.checkAndUpsertHwidUserDevice(user.response, hwidHeaders);
            }

            if (matchedResponseType === RESPONSE_RULES_RESPONSE_TYPES.BROWSER) {
                const subscriptionInfo = await this.getSubscriptionInfoByShortUuid(
                    user.response.shortUuid,
                    subscriptionSettings,
                );
                if (!subscriptionInfo.isOk || !subscriptionInfo.response) {
                    return new SubscriptionNotFoundResponse();
                }
                return subscriptionInfo.response;
            }

            const hosts = await this.getHostsByUserUuid({
                userUuid: user.response.uuid,
                returnDisabledHosts: false,
                returnHiddenHosts: false,
            });

            if (!hosts.isOk || !hosts.response) {
                return new SubscriptionNotFoundResponse();
            }

            if (subscriptionSettings.randomizeHosts) {
                hosts.response = _.shuffle(hosts.response);
            }

            await this.updateAndReportSubscriptionRequest(
                user.response.uuid,
                userAgent,
                srrContext.ip,
            );

            const subscription = await this.renderTemplatesService.generateSubscription({
                srrContext,
                user: user.response,
                hosts: hosts.response,
                hostsOverrides,
            });

            return new SubscriptionWithConfigResponse({
                headers: await this.getUserProfileHeadersInfo(
                    user.response,
                    isXrayExtSupported,
                    subscriptionSettings,
                ),
                body: subscription.subscription,
                contentType: subscription.contentType,
            });
        } catch (error) {
            this.logger.error(error);
            return new SubscriptionNotFoundResponse();
        }
    }

    public async getRawSubscriptionByShortUuid(
        shortUuid: string,
        userAgent: string,
        withDisabledHosts: boolean,
        hwidHeaders: HwidHeaders | null,
        requestIp?: string,
    ): Promise<ICommandResponse<RawSubscriptionWithHostsResponse>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        shortUuid,
                    },
                    {
                        activeInternalSquads: true,
                        lastConnectedNode: true,
                    },
                ),
            );
            if (!user.isOk || !user.response) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const settingEntity = await this.getCachedSubscriptionSettings();

            if (!settingEntity) {
                return {
                    isOk: false,
                    ...ERRORS.SUBSCRIPTION_SETTINGS_NOT_FOUND,
                };
            }

            let isHwidLimited: boolean | undefined;

            const headers = await this.getUserProfileHeadersInfo(
                user.response,
                /^Happ\//.test(userAgent),
                settingEntity,
            );

            if (this.hwidDeviceLimitEnabled) {
                const isAllowed = await this.checkHwidDeviceLimit(user.response, hwidHeaders);

                if (
                    isAllowed.isOk &&
                    isAllowed.response &&
                    !isAllowed.response.isSubscriptionAllowed
                ) {
                    headers.announce = `base64:${Buffer.from(
                        this.configService.getOrThrow<string>('HWID_MAX_DEVICES_ANNOUNCE'),
                    ).toString('base64')}`;
                    headers['x-hwid-limit'] = 'true'; // v2rayTUN

                    isHwidLimited = true;
                }
            } else {
                await this.checkAndUpsertHwidUserDevice(user.response, hwidHeaders);

                isHwidLimited = false;
            }

            const hosts = await this.getHostsByUserUuid({
                userUuid: user.response.uuid,
                returnDisabledHosts: withDisabledHosts,
                returnHiddenHosts: true,
            });

            if (!hosts.isOk || !hosts.response) {
                return {
                    isOk: false,
                    ...ERRORS.GET_ALL_HOSTS_ERROR,
                };
            }

            if (settingEntity.randomizeHosts) {
                hosts.response = _.shuffle(hosts.response);
            }

            await this.updateAndReportSubscriptionRequest(user.response.uuid, userAgent, requestIp);

            let subscription: { rawHosts: IRawHost[] } | undefined;

            if (!isHwidLimited) {
                subscription = await this.renderTemplatesService.generateRawSubscription({
                    user: user.response,
                    hosts: hosts.response,
                });
            }

            return {
                isOk: true,
                response: new RawSubscriptionWithHostsResponse({
                    user: new GetUserResponseModel(user.response, this.subPublicDomain),
                    convertedUserInfo: {
                        daysLeft: dayjs(user.response.expireAt).diff(dayjs(), 'day'),
                        trafficUsed: prettyBytesUtil(user.response.usedTrafficBytes),
                        trafficLimit: prettyBytesUtil(user.response.trafficLimitBytes),
                        lifetimeTrafficUsed: prettyBytesUtil(
                            user.response.lifetimeUsedTrafficBytes,
                        ),
                        isHwidLimited: isHwidLimited ?? false,
                    },
                    headers,
                    rawHosts: subscription?.rawHosts ?? [],
                }),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    /** @deprecated Will be removed soon */
    public async getOutlineSubscriptionByShortUuid(
        shortUuid: string,
        userAgent: string,
        encodedTag: string,
    ): Promise<
        SubscriptionNotFoundResponse | SubscriptionRawResponse | SubscriptionWithConfigResponse
    > {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        shortUuid,
                    },
                    {
                        activeInternalSquads: false,
                        lastConnectedNode: false,
                    },
                ),
            );

            if (!user.isOk || !user.response) {
                return new SubscriptionNotFoundResponse();
            }

            const hosts = await this.getHostsByUserUuid({
                userUuid: user.response.uuid,
                returnDisabledHosts: false,
                returnHiddenHosts: false,
            });

            if (!hosts.isOk || !hosts.response) {
                return new SubscriptionNotFoundResponse();
            }

            await this.updateSubLastOpenedAndUserAgent({
                userUuid: user.response.uuid,
                subLastOpenedAt: new Date(),
                subLastUserAgent: userAgent,
            });

            const subscription = await this.renderTemplatesService.generateOutlineSubscription(
                encodedTag,
                user.response,
                hosts.response,
            );

            return new SubscriptionWithConfigResponse({
                headers: {},
                body: subscription.subscription,
                contentType: subscription.contentType,
            });
        } catch {
            return new SubscriptionNotFoundResponse();
        }
    }

    public async getSubscriptionInfoByShortUuid(
        shortUuid: string,
        settingEntity?: SubscriptionSettingsEntity,
        authenticatedFromBrowser: boolean = false,
    ): Promise<ICommandResponse<SubscriptionRawResponse>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        shortUuid,
                    },
                    {
                        activeInternalSquads: true,
                        lastConnectedNode: false,
                    },
                ),
            );

            if (!user.isOk || !user.response) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            let formattedHosts: IFormattedHost[] = [];
            let xrayLinks: string[] = [];
            let ssConfLinks: Record<string, string> = {};

            if (!this.hwidDeviceLimitEnabled || authenticatedFromBrowser) {
                const hostsResponse = await this.getHostsByUserUuid({
                    userUuid: user.response.uuid,
                    returnDisabledHosts: false,
                    returnHiddenHosts: false,
                });

                formattedHosts = await this.formatHostsService.generateFormattedHosts({
                    hosts: hostsResponse.response || [],
                    user: user.response,
                });

                xrayLinks = this.xrayGeneratorService.generateLinks(formattedHosts, false);

                ssConfLinks = await this.generateSsConfLinks(
                    user.response.shortUuid,
                    formattedHosts,
                );
            }

            let settings: SubscriptionSettingsEntity;
            if (!settingEntity) {
                const settingsResponse = await this.getCachedSubscriptionSettings();

                if (!settingsResponse) {
                    return {
                        isOk: false,
                        ...ERRORS.INTERNAL_SERVER_ERROR,
                    };
                }

                settings = settingsResponse;
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
        user: UserEntity,
        links: string[],
        ssConfLinks: Record<string, string>,
        settingEntity: SubscriptionSettingsEntity,
    ): Promise<SubscriptionRawResponse> {
        const subscriptionUrl = this.resolveSubscriptionUrl(
            user.shortUuid,
            user.username,
            settingEntity.addUsernameToBaseSubscription,
        );

        return new SubscriptionRawResponse({
            isFound: true,
            user: {
                shortUuid: user.shortUuid,
                daysLeft: dayjs(user.expireAt).diff(dayjs(), 'day'),
                trafficUsed: prettyBytesUtil(user.usedTrafficBytes),
                trafficLimit: prettyBytesUtil(user.trafficLimitBytes),
                lifetimeTrafficUsed: prettyBytesUtil(user.lifetimeUsedTrafficBytes),
                lifetimeTrafficUsedBytes: user.lifetimeUsedTrafficBytes.toString(),
                trafficLimitBytes: user.trafficLimitBytes.toString(),
                trafficUsedBytes: user.usedTrafficBytes.toString(),
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

            const settings = await this.getCachedSubscriptionSettings();

            if (!settings) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SERVER_ERROR,
                };
            }

            const subscriptions: SubscriptionRawResponse[] = [];

            await pMap(
                users,
                async (user) => {
                    const hosts = await this.getHostsByUserUuid({
                        userUuid: user.uuid,
                        returnDisabledHosts: false,
                        returnHiddenHosts: false,
                    });
                    const formattedHosts = await this.formatHostsService.generateFormattedHosts({
                        hosts: hosts.response || [],
                        user: user,
                    });

                    const xrayLinks = this.xrayGeneratorService.generateLinks(
                        formattedHosts,
                        false,
                    );

                    const ssConfLinks = await this.generateSsConfLinks(
                        user.shortUuid,
                        formattedHosts,
                    );

                    subscriptions.push(
                        await this.getUserInfo(user, xrayLinks, ssConfLinks, settings),
                    );
                },
                { concurrency: 100 },
            );

            return {
                isOk: true,
                response: {
                    total,
                    subscriptions,
                },
            };
        } catch (error) {
            this.logger.error(`Error getting all subscriptions: ${error}`);
            return {
                isOk: false,
                ...ERRORS.GETTING_ALL_SUBSCRIPTIONS_ERROR,
            };
        }
    }

    public async getSubscriptionByUniqueField(
        uniqueField: string,
        uniqueFieldKey: 'username' | 'shortUuid' | 'uuid',
    ): Promise<ICommandResponse<SubscriptionRawResponse>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        [uniqueFieldKey]: uniqueField,
                    },
                    {
                        activeInternalSquads: false,
                        lastConnectedNode: false,
                    },
                ),
            );

            if (!user.isOk || !user.response) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const result = await this.getSubscriptionInfoByShortUuid(
                user.response.shortUuid,
                undefined,
                true,
            );

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
        user: UserEntity,
        isHapp: boolean,
        settings: SubscriptionSettingsEntity,
    ): Promise<ISubscriptionHeaders> {
        const headers: ISubscriptionHeaders = {
            'content-disposition': `attachment; filename=${user.username}`,
            'support-url': settings.supportLink,
            'profile-title': `base64:${Buffer.from(
                TemplateEngine.formatWithUser(settings.profileTitle, user, this.subPublicDomain),
            ).toString('base64')}`,
            'profile-update-interval': settings.profileUpdateInterval.toString(),
            'subscription-userinfo': Object.entries(getSubscriptionUserInfo(user))
                .map(([key, val]) => `${key}=${val}`)
                .join('; '),
        };

        if (settings.happAnnounce) {
            headers.announce = `base64:${Buffer.from(
                TemplateEngine.formatWithUser(settings.happAnnounce, user, this.subPublicDomain),
            ).toString('base64')}`;
        }

        if (isHapp && settings.happRouting) {
            headers.routing = settings.happRouting;
        }

        if (settings.isProfileWebpageUrlEnabled) {
            headers['profile-web-page-url'] = this.resolveSubscriptionUrl(
                user.shortUuid,
                user.username,
                settings.addUsernameToBaseSubscription,
            );
        }

        const refillDate = getSubscriptionRefillDate(user.trafficLimitStrategy);
        if (refillDate) {
            headers['subscription-refill-date'] = refillDate;
        }

        if (settings.customResponseHeaders) {
            for (const [key, value] of Object.entries(settings.customResponseHeaders)) {
                headers[key] = TemplateEngine.formatWithUser(
                    value,
                    user,
                    this.subPublicDomain,
                    true,
                );
            }
        }

        return headers;
    }

    private async getUsersWithPagination(
        dto: GetUsersWithPaginationQuery,
    ): Promise<ICommandResponse<{ users: UserEntity[]; total: number }>> {
        return this.queryBus.execute<
            GetUsersWithPaginationQuery,
            ICommandResponse<{ users: UserEntity[]; total: number }>
        >(new GetUsersWithPaginationQuery(dto.start, dto.size));
    }

    private async getHostsByUserUuid(
        dto: GetHostsForUserQuery,
    ): Promise<ICommandResponse<HostWithRawInbound[]>> {
        return this.queryBus.execute<GetHostsForUserQuery, ICommandResponse<HostWithRawInbound[]>>(
            new GetHostsForUserQuery(dto.userUuid, dto.returnDisabledHosts, dto.returnHiddenHosts),
        );
    }

    private async getSubscriptionSettings(): Promise<ICommandResponse<SubscriptionSettingsEntity>> {
        return this.queryBus.execute<
            GetSubscriptionSettingsQuery,
            ICommandResponse<SubscriptionSettingsEntity>
        >(new GetSubscriptionSettingsQuery());
    }

    private async getCachedSubscriptionSettings(): Promise<SubscriptionSettingsEntity | null> {
        const cached = await this.cacheManager.get<SubscriptionSettingsEntity>(
            CACHE_KEYS.SUBSCRIPTION_SETTINGS,
        );
        if (cached) {
            return cached;
        }

        const settings = await this.getSubscriptionSettings();
        if (!settings.isOk || !settings.response) {
            return null;
        }

        await this.cacheManager.set(CACHE_KEYS.SUBSCRIPTION_SETTINGS, settings.response, 3_600_000);
        return settings.response;
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
        user: UserEntity,
        hwidHeaders: HwidHeaders | null,
    ): Promise<
        ICommandResponse<{
            isSubscriptionAllowed: boolean;
        }>
    > {
        try {
            if (user.hwidDeviceLimit === 0) {
                if (hwidHeaders !== null) {
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
                }

                return { isOk: true, response: { isSubscriptionAllowed: true } };
            }

            if (hwidHeaders === null) {
                return { isOk: true, response: { isSubscriptionAllowed: false } };
            }

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

                    return { isOk: true, response: { isSubscriptionAllowed: true } };
                }
            }

            const count = await this.countHwidUserDevices({ userUuid: user.uuid });

            const deviceLimit = user.hwidDeviceLimit ?? this.hwidFallbackDeviceLimit ?? 0;

            if (!count.isOk || count.response === undefined) {
                return { isOk: true, response: { isSubscriptionAllowed: false } };
            }

            if (count.response >= deviceLimit) {
                return { isOk: true, response: { isSubscriptionAllowed: false } };
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
                return { isOk: false, response: { isSubscriptionAllowed: false } };
            }

            this.eventEmitter.emit(
                EVENTS.USER_HWID_DEVICES.ADDED,
                new UserHwidDeviceEvent(user, result.response, EVENTS.USER_HWID_DEVICES.ADDED),
            );

            return { isOk: true, response: { isSubscriptionAllowed: true } };
        } catch (error) {
            this.logger.error(`Error checking hwid device limit: ${error}`);
            return { isOk: false, response: { isSubscriptionAllowed: false } };
        }
    }

    private async checkAndUpsertHwidUserDevice(
        user: UserEntity,
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

    private resolveSubscriptionUrl(
        shortUuid: string,
        username: string,
        addUsernameToBaseSubscription: boolean,
    ): string {
        if (addUsernameToBaseSubscription) {
            return `https://${this.subPublicDomain}/${shortUuid}#${username}`;
        }

        return `https://${this.subPublicDomain}/${shortUuid}`;
    }

    private async updateAndReportSubscriptionRequest(
        userUuid: string,
        userAgent: string,
        requestIp?: string,
    ): Promise<void> {
        try {
            await this.updateSubLastOpenedAndUserAgent({
                userUuid,
                subLastOpenedAt: new Date(),
                subLastUserAgent: userAgent,
            });

            await this.userSubscriptionRequestHistoryQueue.addRecord({
                userUuid,
                requestAt: new Date(),
                requestIp,
                userAgent,
            });

            return;
        } catch (error) {
            this.logger.error(`Error updating and reporting subscription request: ${error}`);

            return;
        }
    }
}
