import dayjs from 'dayjs';
import pMap from 'p-map';
import _ from 'lodash';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';

import { TemplateEngine } from '@common/utils/templates/replace-templates-values';
import { prettyBytesUtil } from '@common/utils/bytes/pretty-bytes.util';
import { HwidHeaders } from '@common/utils/extract-hwid-headers';
import { hasContent } from '@common/utils/convert-type';
import { fail, ok, TResult } from '@common/types';
import { ERRORS, EVENTS, TSubscriptionTemplateType, USERS_STATUS } from '@libs/contracts/constants';
import { THwidSettings } from '@libs/contracts/models';

import { UserHwidDeviceEvent } from '@integration-modules/notifications/interfaces';

import { GetCachedSubscriptionSettingsQuery } from '@modules/subscription-settings/queries/get-cached-subscrtipion-settings';
import { ResponseRulesMatcherService } from '@modules/subscription-response-rules/services/response-rules-matcher.service';
import { GetCachedExternalSquadSettingsQuery } from '@modules/external-squads/queries/get-cached-external-squad-settings';
import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities/subscription-settings.entity';
import { UpsertHwidUserDeviceCommand } from '@modules/hwid-user-devices/commands/upsert-hwid-user-device';
import { XrayGeneratorService } from '@modules/subscription-template/generators/xray.generator.service';
import { FormatHostsService } from '@modules/subscription-template/generators/format-hosts.service';
import { HwidUserDeviceEntity } from '@modules/hwid-user-devices/entities/hwid-user-device.entity';
import { RenderTemplatesService } from '@modules/subscription-template/render-templates.service';
import { CountUsersDevicesQuery } from '@modules/hwid-user-devices/queries/count-users-devices';
import { IFormattedHost, IRawHost } from '@modules/subscription-template/generators/interfaces';
import { GetUsersWithPaginationQuery } from '@modules/users/queries/get-users-with-pagination';
import { isJsonSubscriptionFallbackSupported } from '@modules/subscription-template/constants';
import { ExternalSquadEntity } from '@modules/external-squads/entities/external-squad.entity';
import { CheckHwidExistsQuery } from '@modules/hwid-user-devices/queries/check-hwid-exists';
import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';
import { GetUserSubpageConfigQuery } from '@modules/users/queries/get-user-subpage-config';
import { GetTemplateNameQuery } from '@modules/external-squads/queries/get-template-name';
import { ISRRContext } from '@modules/subscription-response-rules/interfaces';
import { UserEntity } from '@modules/users/entities/user.entity';
import { GetFullUserResponseModel } from '@modules/users/models';

import { UsersQueuesService } from '@queue/_users/users-queues.service';

import {
    ConnectionKeysResponseModel,
    RawSubscriptionWithHostsResponse,
    SubscriptionNotFoundResponse,
    SubscriptionRawResponse,
    SubscriptionWithConfigResponse,
} from './models';
import { getSubscriptionRefillDate, getSubscriptionUserInfo } from './utils/get-user-info.headers';
import { GetSubpageConfigResponseModel } from './models/get-subpage-config.response.model';
import { GetHostsForUserQuery } from '../hosts/queries/get-hosts-for-user';
import { ISubscriptionHeaders, IGetSubscriptionInfo } from './interfaces';
import { GetAllSubscriptionsQueryDto } from './dto';

@Injectable()
export class SubscriptionService {
    private readonly logger = new Logger(SubscriptionService.name);
    private readonly subPublicDomain: string;

    constructor(
        private readonly queryBus: QueryBus,
        private readonly configService: ConfigService,
        private readonly commandBus: CommandBus,
        private readonly eventEmitter: EventEmitter2,
        private readonly renderTemplatesService: RenderTemplatesService,
        private readonly formatHostsService: FormatHostsService,
        private readonly xrayGeneratorService: XrayGeneratorService,
        private readonly usersQueuesService: UsersQueuesService,
        private readonly srrMatcher: ResponseRulesMatcherService,
    ) {
        this.subPublicDomain = this.configService.getOrThrow<string>('SUB_PUBLIC_DOMAIN');
    }

    public async getSubscriptionByShortUuid(
        srrContext: ISRRContext,
        shortUuid: string,
    ): Promise<
        SubscriptionNotFoundResponse | SubscriptionRawResponse | SubscriptionWithConfigResponse
    > {
        try {
            const { userAgent, hwidHeaders, matchedResponseType, isXrayExtSupported } = srrContext;

            if (matchedResponseType === 'BROWSER') {
                const subscriptionInfo = await this.getSubscriptionInfo({
                    searchBy: {
                        uniqueFieldKey: 'shortUuid',
                        uniqueField: shortUuid,
                    },
                    authenticated: false,
                });

                if (!subscriptionInfo.isOk) {
                    return new SubscriptionNotFoundResponse();
                }

                return subscriptionInfo.response;
            }

            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        shortUuid,
                    },
                    {
                        activeInternalSquads: false,
                    },
                ),
            );

            if (!user.isOk) {
                return new SubscriptionNotFoundResponse();
            }

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

                    if (templateName.isOk) {
                        srrContext.overrideTemplateName = templateName.response;
                    }
                }
            }

            const { subscriptionSettings: patchedSubscriptionSettings, hostsOverrides } =
                await this.applyMaybeExternalSquadOverrides(
                    srrContext.subscriptionSettings,
                    user.response.externalSquadUuid,
                );

            srrContext.subscriptionSettings = patchedSubscriptionSettings;

            const subscriptionSettings = srrContext.subscriptionSettings;

            if (subscriptionSettings.hwidSettings.enabled) {
                const isAllowed = await this.checkHwidDeviceLimit(
                    user.response,
                    hwidHeaders,
                    subscriptionSettings.hwidSettings,
                );

                if (isAllowed.isOk && !isAllowed.response.isSubscriptionAllowed) {
                    const response = new SubscriptionWithConfigResponse({
                        headers: await this.getUserProfileHeadersInfo(
                            user.response,
                            isXrayExtSupported,
                            subscriptionSettings,
                        ),
                        body: '',
                        contentType: 'text/plain',
                    });

                    if (subscriptionSettings.hwidSettings.maxDevicesAnnounce) {
                        response.headers.announce = `base64:${Buffer.from(
                            TemplateEngine.formatWithUser(
                                subscriptionSettings.hwidSettings.maxDevicesAnnounce,
                                user.response,
                                subscriptionSettings,
                                this.subPublicDomain,
                            ),
                        ).toString('base64')}`;
                    }

                    if (
                        (isAllowed.response.maxDeviceReached ||
                            isAllowed.response.hwidNotSupported) &&
                        subscriptionSettings.isShowCustomRemarks
                    ) {
                        const { subscription, contentType } =
                            await this.renderTemplatesService.generateSubscription({
                                srrContext,
                                user: user.response,
                                hosts: [],
                                fallbackOptions: {
                                    showHwidMaxDeviceRemarks: isAllowed.response.maxDeviceReached,
                                    showHwidNotSupportedRemarks:
                                        isAllowed.response.hwidNotSupported,
                                },
                            });

                        response.body = subscription;
                        response.contentType = contentType;
                    }

                    response.headers['x-hwid-limit'] = 'true'; // v2rayTUN

                    return response;
                }
            } else {
                await this.checkAndUpsertHwidUserDevice(user.response, hwidHeaders);
            }

            if (
                srrContext.subscriptionSettings.serveJsonAtBaseSubscription &&
                srrContext.matchedResponseType === 'XRAY_BASE64' &&
                !srrContext.ignoreServeJsonAtBaseSubscription
            ) {
                if (isJsonSubscriptionFallbackSupported(srrContext.userAgent)) {
                    srrContext.matchedResponseType = 'XRAY_JSON';
                }
            }

            const hosts = await this.queryBus.execute(
                new GetHostsForUserQuery(
                    user.response.tId,
                    false,
                    srrContext.matchedResponseType === 'XRAY_JSON',
                ),
            );

            if (!hosts.isOk) {
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
    ): Promise<TResult<RawSubscriptionWithHostsResponse>> {
        try {
            const userResult = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        shortUuid,
                    },
                    {
                        activeInternalSquads: true,
                    },
                ),
            );
            if (!userResult.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const user = userResult.response;

            const settingEntity = await this.queryBus.execute(
                new GetCachedSubscriptionSettingsQuery(),
            );

            if (!settingEntity) {
                return fail(ERRORS.SUBSCRIPTION_SETTINGS_NOT_FOUND);
            }

            const {
                subscriptionSettings: patchedSettingEntity,
                hostsOverrides: patchedHostsOverrides,
            } = await this.applyMaybeExternalSquadOverrides(settingEntity, user.externalSquadUuid);

            let isHwidLimited: boolean | undefined;

            const headers = await this.getUserProfileHeadersInfo(
                user,
                /^Happ\//.test(userAgent),
                patchedSettingEntity,
            );

            if (patchedSettingEntity.hwidSettings.enabled) {
                const isAllowed = await this.checkHwidDeviceLimit(
                    user,
                    hwidHeaders,
                    patchedSettingEntity.hwidSettings,
                );

                if (isAllowed.isOk && !isAllowed.response.isSubscriptionAllowed) {
                    if (patchedSettingEntity.hwidSettings.maxDevicesAnnounce) {
                        headers.announce = `base64:${Buffer.from(
                            patchedSettingEntity.hwidSettings.maxDevicesAnnounce,
                        ).toString('base64')}`;
                    }

                    headers['x-hwid-limit'] = 'true'; // v2rayTUN

                    isHwidLimited = true;
                }
            } else {
                await this.checkAndUpsertHwidUserDevice(user, hwidHeaders);

                isHwidLimited = false;
            }

            const hosts = await this.queryBus.execute(
                new GetHostsForUserQuery(user.tId, withDisabledHosts, true),
            );

            if (!hosts.isOk) {
                return fail(ERRORS.GET_ALL_HOSTS_ERROR);
            }

            if (settingEntity.randomizeHosts) {
                hosts.response = _.shuffle(hosts.response);
            }

            await this.updateAndReportSubscriptionRequest(user.uuid, userAgent, requestIp);

            let subscription: { rawHosts: IRawHost[] } | undefined;

            if (!isHwidLimited) {
                subscription = await this.renderTemplatesService.generateRawSubscription({
                    subscriptionSettings: patchedSettingEntity,
                    user: user,
                    hosts: hosts.response,
                    hostsOverrides: patchedHostsOverrides,
                });
            }

            return ok(
                new RawSubscriptionWithHostsResponse({
                    user: new GetFullUserResponseModel(user, this.subPublicDomain),
                    convertedUserInfo: {
                        daysLeft: dayjs(user.expireAt).diff(dayjs(), 'day'),
                        trafficUsed: prettyBytesUtil(user.userTraffic.usedTrafficBytes),
                        trafficLimit: prettyBytesUtil(user.trafficLimitBytes),
                        lifetimeTrafficUsed: prettyBytesUtil(
                            user.userTraffic.lifetimeUsedTrafficBytes,
                        ),
                        isHwidLimited: isHwidLimited ?? false,
                    },
                    headers,
                    rawHosts: subscription?.rawHosts ?? [],
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
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
            const userResult = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        shortUuid,
                    },
                    {
                        activeInternalSquads: false,
                    },
                ),
            );

            if (!userResult.isOk) {
                return new SubscriptionNotFoundResponse();
            }

            const user = userResult.response;

            const settings = await this.queryBus.execute(new GetCachedSubscriptionSettingsQuery());

            const hosts = await this.queryBus.execute(
                new GetHostsForUserQuery(user.tId, false, false),
            );

            if (!hosts.isOk || !settings) {
                return new SubscriptionNotFoundResponse();
            }

            await this.usersQueuesService.updateUserSub({
                userUuid: user.uuid,
                subLastOpenedAt: new Date(),
                subLastUserAgent: userAgent,
            });

            const subscription = await this.renderTemplatesService.generateOutlineSubscription(
                settings,
                encodedTag,
                user,
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

    public async getSubscriptionInfo(
        params: IGetSubscriptionInfo,
    ): Promise<TResult<SubscriptionRawResponse>> {
        try {
            const { searchBy, authenticated, userEntity: userEntityParam } = params;

            let userEntity: UserEntity | undefined = userEntityParam;

            if (!userEntity && searchBy) {
                const userResult = await this.queryBus.execute(
                    new GetUserByUniqueFieldQuery(
                        {
                            [searchBy.uniqueFieldKey]: searchBy.uniqueField,
                        },
                        {
                            activeInternalSquads: false,
                        },
                    ),
                );

                if (!userResult.isOk) {
                    return fail(ERRORS.USER_NOT_FOUND);
                }

                userEntity = userResult.response;
            }

            if (!userEntity) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            let settings: SubscriptionSettingsEntity | null = null;
            let hostsOverrides: ExternalSquadEntity['hostOverrides'] | undefined;

            if (params.overrides) {
                settings = params.overrides.subscriptionSettings;
                hostsOverrides = params.overrides.hostsOverrides;
            } else if (params.subscriptionSettingsRaw) {
                settings = params.subscriptionSettingsRaw;
            } else {
                settings = await this.queryBus.execute(new GetCachedSubscriptionSettingsQuery());
            }

            if (!settings) {
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            if (userEntity.externalSquadUuid && !params.overrides) {
                const {
                    subscriptionSettings: patchedSubscriptionSettings,
                    hostsOverrides: patchedHostsOverrides,
                } = await this.applyMaybeExternalSquadOverrides(
                    settings,
                    userEntity.externalSquadUuid,
                );

                settings = patchedSubscriptionSettings;
                hostsOverrides = patchedHostsOverrides;
            }

            let formattedHosts: IFormattedHost[] = [];
            let xrayLinks: string[] = [];
            let ssConfLinks: Record<string, string> = {};

            if (!settings.hwidSettings.enabled || authenticated) {
                const hostsResponse = await this.queryBus.execute(
                    new GetHostsForUserQuery(userEntity.tId, false, false),
                );

                formattedHosts = await this.formatHostsService.generateFormattedHosts({
                    subscriptionSettings: settings,
                    hosts: hostsResponse.isOk ? hostsResponse.response : [],
                    user: userEntity,
                    hostsOverrides,
                });

                xrayLinks = this.xrayGeneratorService.generateLinks(formattedHosts, false);

                ssConfLinks = await this.generateSsConfLinks(userEntity.shortUuid, formattedHosts);
            }

            return ok(await this.getUserInfo(userEntity, xrayLinks, ssConfLinks));
        } catch (error) {
            this.logger.error(`Error getting subscription info: ${error}`);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    private async getUserInfo(
        user: UserEntity,
        links: string[],
        ssConfLinks: Record<string, string>,
    ): Promise<SubscriptionRawResponse> {
        return new SubscriptionRawResponse({
            isFound: true,
            user: {
                shortUuid: user.shortUuid,
                daysLeft: dayjs(user.expireAt).diff(dayjs(), 'day'),
                trafficUsed: prettyBytesUtil(user.userTraffic.usedTrafficBytes),
                trafficLimit: prettyBytesUtil(user.trafficLimitBytes),
                lifetimeTrafficUsed: prettyBytesUtil(user.userTraffic.lifetimeUsedTrafficBytes),
                lifetimeTrafficUsedBytes: user.userTraffic.lifetimeUsedTrafficBytes.toString(),
                trafficLimitBytes: user.trafficLimitBytes.toString(),
                trafficUsedBytes: user.userTraffic.usedTrafficBytes.toString(),
                username: user.username,
                expiresAt: user.expireAt,
                isActive: user.status === USERS_STATUS.ACTIVE,
                userStatus: user.status,
                trafficLimitStrategy: user.trafficLimitStrategy,
            },
            links,
            ssConfLinks,
            subscriptionUrl: this.resolveSubscriptionUrl(user.shortUuid),
        });
    }

    public async getAllSubscriptions(query: GetAllSubscriptionsQueryDto): Promise<
        TResult<{
            total: number;
            subscriptions: SubscriptionRawResponse[];
        }>
    > {
        try {
            const { start, size } = query;

            const usersResponse = await this.getUsersWithPagination({ start, size });

            if (!usersResponse.isOk) {
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            const users = usersResponse.response.users;
            const total = usersResponse.response.total;

            const settings = await this.queryBus.execute(new GetCachedSubscriptionSettingsQuery());

            if (!settings) {
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            const subscriptions: SubscriptionRawResponse[] = [];

            await pMap(
                users,
                async (user) => {
                    const subscriptionInfo = await this.getSubscriptionInfo({
                        userEntity: user,
                        authenticated: true,
                        subscriptionSettingsRaw: settings,
                    });

                    if (!subscriptionInfo.isOk) {
                        return;
                    }

                    subscriptions.push(subscriptionInfo.response);
                },
                { concurrency: 70 },
            );

            return ok({ total, subscriptions });
        } catch (error) {
            this.logger.error(`Error getting all subscriptions: ${error}`);
            return fail(ERRORS.GETTING_ALL_SUBSCRIPTIONS_ERROR);
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
                TemplateEngine.formatWithUser(
                    settings.profileTitle,
                    user,
                    settings,
                    this.subPublicDomain,
                ),
            ).toString('base64')}`,
            'profile-update-interval': settings.profileUpdateInterval.toString(),
            'subscription-userinfo': Object.entries(getSubscriptionUserInfo(user))
                .map(([key, val]) => `${key}=${val}`)
                .join('; '),
        };

        if (settings.happAnnounce) {
            headers.announce = `base64:${Buffer.from(
                TemplateEngine.formatWithUser(
                    settings.happAnnounce,
                    user,
                    settings,
                    this.subPublicDomain,
                ),
            ).toString('base64')}`;
        }

        if (isHapp && settings.happRouting) {
            headers.routing = settings.happRouting;
        }

        if (settings.isProfileWebpageUrlEnabled) {
            headers['profile-web-page-url'] = this.resolveSubscriptionUrl(user.shortUuid);
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
                    settings,
                    this.subPublicDomain,
                    true,
                );
            }
        }

        return headers;
    }

    private async applyMaybeExternalSquadOverrides(
        subscriptionSettings: SubscriptionSettingsEntity,
        externalSquadUuid: string | null | undefined,
    ): Promise<{
        subscriptionSettings: SubscriptionSettingsEntity;
        hostsOverrides: ExternalSquadEntity['hostOverrides'] | undefined;
    }> {
        let patchedSubscriptionSettings: SubscriptionSettingsEntity = subscriptionSettings;

        try {
            let hostsOverrides: ExternalSquadEntity['hostOverrides'] | undefined = undefined;

            if (externalSquadUuid !== null && externalSquadUuid !== undefined) {
                const externalSquadSubscriptionSettings = await this.queryBus.execute(
                    new GetCachedExternalSquadSettingsQuery(externalSquadUuid),
                );

                if (externalSquadSubscriptionSettings !== null) {
                    // Host overrides
                    if (hasContent(externalSquadSubscriptionSettings.hostOverrides)) {
                        hostsOverrides = externalSquadSubscriptionSettings.hostOverrides;
                    }

                    // Subscription settings override
                    if (hasContent(externalSquadSubscriptionSettings.subscriptionSettings)) {
                        patchedSubscriptionSettings = {
                            ...patchedSubscriptionSettings,
                            ...externalSquadSubscriptionSettings.subscriptionSettings,
                        };
                    }

                    // Response headers override
                    if (hasContent(externalSquadSubscriptionSettings.responseHeaders)) {
                        patchedSubscriptionSettings.customResponseHeaders =
                            externalSquadSubscriptionSettings.responseHeaders;
                    }

                    // HWID settings override
                    if (hasContent(externalSquadSubscriptionSettings.hwidSettings)) {
                        patchedSubscriptionSettings.hwidSettings =
                            externalSquadSubscriptionSettings.hwidSettings;
                    }

                    // Custom remarks override
                    if (hasContent(externalSquadSubscriptionSettings.customRemarks)) {
                        patchedSubscriptionSettings.customRemarks =
                            externalSquadSubscriptionSettings.customRemarks;
                    }
                }
            }

            return {
                subscriptionSettings: patchedSubscriptionSettings,
                hostsOverrides,
            };
        } catch (error) {
            this.logger.error(`Error applying external squad overrides: ${error}`);
            return {
                subscriptionSettings: patchedSubscriptionSettings,
                hostsOverrides: undefined,
            };
        }
    }

    private async getUsersWithPagination(
        dto: GetUsersWithPaginationQuery,
    ): Promise<TResult<{ users: UserEntity[]; total: number }>> {
        return this.queryBus.execute<
            GetUsersWithPaginationQuery,
            TResult<{ users: UserEntity[]; total: number }>
        >(new GetUsersWithPaginationQuery(dto.start, dto.size));
    }

    private async countHwidUserDevices(dto: CountUsersDevicesQuery): Promise<TResult<number>> {
        return this.queryBus.execute<CountUsersDevicesQuery, TResult<number>>(
            new CountUsersDevicesQuery(dto.userUuid),
        );
    }

    private async checkHwidDeviceExists(
        dto: CheckHwidExistsQuery,
    ): Promise<TResult<{ exists: boolean }>> {
        return this.queryBus.execute<CheckHwidExistsQuery, TResult<{ exists: boolean }>>(
            new CheckHwidExistsQuery(dto.hwid, dto.userUuid),
        );
    }

    private async checkHwidDeviceLimit(
        user: UserEntity,
        hwidHeaders: HwidHeaders | null,
        hwidSettings: THwidSettings,
    ): Promise<
        TResult<{
            isSubscriptionAllowed: boolean;
            maxDeviceReached: boolean;
            hwidNotSupported: boolean;
        }>
    > {
        try {
            if (user.hwidDeviceLimit === 0) {
                if (hwidHeaders !== null) {
                    await this.usersQueuesService.checkAndUpsertHwidDevice({
                        hwid: hwidHeaders.hwid,
                        userUuid: user.uuid,
                        platform: hwidHeaders.platform,
                        osVersion: hwidHeaders.osVersion,
                        deviceModel: hwidHeaders.deviceModel,
                        userAgent: hwidHeaders.userAgent,
                    });
                }
                return ok({
                    isSubscriptionAllowed: true,
                    maxDeviceReached: false,
                    hwidNotSupported: false,
                });
            }

            if (hwidHeaders === null) {
                return ok({
                    isSubscriptionAllowed: false,
                    maxDeviceReached: false,
                    hwidNotSupported: true,
                });
            }

            const isDeviceExists = await this.checkHwidDeviceExists({
                hwid: hwidHeaders.hwid,
                userUuid: user.uuid,
            });

            if (isDeviceExists.isOk) {
                if (isDeviceExists.response.exists) {
                    await this.usersQueuesService.checkAndUpsertHwidDevice({
                        hwid: hwidHeaders.hwid,
                        userUuid: user.uuid,
                        platform: hwidHeaders.platform,
                        osVersion: hwidHeaders.osVersion,
                        deviceModel: hwidHeaders.deviceModel,
                        userAgent: hwidHeaders.userAgent,
                    });

                    return ok({
                        isSubscriptionAllowed: true,
                        maxDeviceReached: false,
                        hwidNotSupported: false,
                    });
                }
            }

            const count = await this.countHwidUserDevices({ userUuid: user.uuid });

            const deviceLimit = user.hwidDeviceLimit ?? hwidSettings.fallbackDeviceLimit;

            if (!count.isOk) {
                return ok({
                    isSubscriptionAllowed: false,
                    maxDeviceReached: true,
                    hwidNotSupported: false,
                });
            }

            if (count.response >= deviceLimit) {
                return ok({
                    isSubscriptionAllowed: false,
                    maxDeviceReached: true,
                    hwidNotSupported: false,
                });
            }

            const result = await this.commandBus.execute(
                new UpsertHwidUserDeviceCommand(
                    new HwidUserDeviceEntity({
                        hwid: hwidHeaders.hwid,
                        userUuid: user.uuid,
                        platform: hwidHeaders.platform,
                        osVersion: hwidHeaders.osVersion,
                        deviceModel: hwidHeaders.deviceModel,
                        userAgent: hwidHeaders.userAgent,
                    }),
                ),
            );

            if (!result.isOk) {
                this.logger.error(`Error creating Hwid user device, access forbidden.`);

                return ok({
                    isSubscriptionAllowed: false,
                    maxDeviceReached: true,
                    hwidNotSupported: false,
                });
            }

            this.eventEmitter.emit(
                EVENTS.USER_HWID_DEVICES.ADDED,
                new UserHwidDeviceEvent(user, result.response, EVENTS.USER_HWID_DEVICES.ADDED),
            );

            return ok({
                isSubscriptionAllowed: true,
                maxDeviceReached: false,
                hwidNotSupported: false,
            });
        } catch (error) {
            this.logger.error(`Error checking hwid device limit: ${error}`);
            return ok({
                isSubscriptionAllowed: false,
                maxDeviceReached: true,
                hwidNotSupported: false,
            });
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

            await this.usersQueuesService.checkAndUpsertHwidDevice({
                hwid: hwidHeaders.hwid,
                userUuid: user.uuid,
                platform: hwidHeaders.platform,
                osVersion: hwidHeaders.osVersion,
                deviceModel: hwidHeaders.deviceModel,
                userAgent: hwidHeaders.userAgent,
            });
        } catch (error) {
            this.logger.error(`Error upserting hwid user device: ${error}`);

            return;
        }
    }

    private resolveSubscriptionUrl(shortUuid: string): string {
        return `https://${this.subPublicDomain}/${shortUuid}`;
    }

    private async updateAndReportSubscriptionRequest(
        userUuid: string,
        userAgent: string,
        requestIp?: string,
    ): Promise<void> {
        try {
            await this.usersQueuesService.updateUserSub({
                userUuid,
                subLastOpenedAt: new Date(),
                subLastUserAgent: userAgent,
            });

            await this.usersQueuesService.addSubscriptionRequestRecord({
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

    public async getSubpageConfigByShortUuid(
        shortUuid: string,
        requestHeaders: Record<string, string>,
    ): Promise<TResult<GetSubpageConfigResponseModel>> {
        let subpageConfigUuid: string | null = null;
        let webpageAllowed: boolean = false;

        try {
            const [subpageConfigUuidResult, settingsEntity] = await Promise.all([
                this.queryBus.execute(new GetUserSubpageConfigQuery(shortUuid)),
                this.queryBus.execute(new GetCachedSubscriptionSettingsQuery()),
            ]);

            if (subpageConfigUuidResult.isOk) {
                subpageConfigUuid = subpageConfigUuidResult.response;
            }

            if (settingsEntity && settingsEntity.responseRules) {
                const result = this.srrMatcher.matchRules(
                    settingsEntity.responseRules,
                    requestHeaders,
                    undefined,
                );

                webpageAllowed = result.matched === true && result.responseType === 'BROWSER';
            }

            return ok(
                new GetSubpageConfigResponseModel({
                    subpageConfigUuid,
                    webpageAllowed,
                }),
            );
        } catch (error) {
            this.logger.error(`Error getting subpage config by short uuid: ${error}`);
            return ok(
                new GetSubpageConfigResponseModel({
                    subpageConfigUuid: null,
                    webpageAllowed: false,
                }),
            );
        }
    }

    public async getConnectionKeysByUuid(
        uuid: string,
    ): Promise<TResult<ConnectionKeysResponseModel>> {
        try {
            const userResult = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid,
                    },
                    {
                        activeInternalSquads: false,
                    },
                ),
            );

            if (!userResult.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const userEntity = userResult.response;

            if (!userEntity) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            let settings = await this.queryBus.execute(new GetCachedSubscriptionSettingsQuery());
            let hostsOverrides: ExternalSquadEntity['hostOverrides'] | undefined;

            if (!settings) {
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            if (userEntity.externalSquadUuid) {
                const {
                    subscriptionSettings: patchedSubscriptionSettings,
                    hostsOverrides: patchedHostsOverrides,
                } = await this.applyMaybeExternalSquadOverrides(
                    settings,
                    userEntity.externalSquadUuid,
                );

                settings = patchedSubscriptionSettings;
                hostsOverrides = patchedHostsOverrides;
            }

            const allHostsResult = await this.queryBus.execute(
                new GetHostsForUserQuery(userEntity.tId, true, true),
            );

            const allHosts = allHostsResult.isOk ? allHostsResult.response : [];

            const enabledHosts = allHosts.filter((h) => !h.isDisabled && !h.isHidden);
            const disabledHosts = allHosts.filter((h) => h.isDisabled && !h.isHidden);
            const hiddenHosts = allHosts.filter((h) => h.isHidden && !h.isDisabled);

            const formatOrSkip = async (hosts: typeof allHosts, allowEmpty: boolean = false) => {
                if (hosts.length === 0 && !allowEmpty) return [];
                return this.formatHostsService.generateFormattedHosts({
                    subscriptionSettings: settings,
                    hosts,
                    user: userEntity,
                    hostsOverrides,
                });
            };

            const formattedEnabled = await formatOrSkip(enabledHosts, true);
            const formattedDisabled = await formatOrSkip(disabledHosts);
            const formattedHidden = await formatOrSkip(hiddenHosts);

            return ok(
                new ConnectionKeysResponseModel({
                    enabledKeys: this.xrayGeneratorService.generateLinks(formattedEnabled, false),
                    disabledKeys: this.xrayGeneratorService.generateLinks(formattedDisabled, false),
                    hiddenKeys: this.xrayGeneratorService.generateLinks(formattedHidden, false),
                }),
            );
        } catch (error) {
            this.logger.error(`Error getting subscription info: ${error}`);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
