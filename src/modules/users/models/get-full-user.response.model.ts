import { TResetPeriods, TUsersStatus } from '@libs/contracts/constants';

import { InternalSquadEntity } from '@modules/internal-squads/entities';

import { UserEntity } from '../entities';

export class GetFullUserResponseModel {
    public readonly uuid: string;
    public readonly id: number;
    public readonly shortUuid: string;
    public readonly username: string;

    public readonly status: TUsersStatus;

    public readonly trafficLimitBytes: number;
    public readonly trafficLimitStrategy: TResetPeriods;

    public readonly expireAt: Date;

    public readonly telegramId: number | null;
    public readonly email: string | null;
    public readonly description: null | string;
    public readonly tag: null | string;

    public readonly hwidDeviceLimit: number | null;
    public readonly externalSquadUuid: string | null;

    public readonly trojanPassword: string;
    public readonly vlessUuid: string;
    public readonly ssPassword: string;

    public readonly lastTriggeredThreshold: number;
    public readonly subRevokedAt: Date | null;
    public readonly subLastUserAgent: null | string;
    public readonly subLastOpenedAt: Date | null;
    public readonly lastTrafficResetAt: Date | null;

    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public readonly subscriptionUrl: string;
    public readonly activeInternalSquads: Omit<
        InternalSquadEntity,
        'createdAt' | 'updatedAt' | 'viewPosition'
    >[];
    public readonly userTraffic: {
        usedTrafficBytes: number;
        lifetimeUsedTrafficBytes: number;
        onlineAt: Date | null;
        lastConnectedNodeUuid: string | null;
        firstConnectedAt: Date | null;
    };

    constructor(entity: UserEntity, subPublicDomain: string) {
        this.id = Number(entity.tId);
        this.uuid = entity.uuid;
        this.shortUuid = entity.shortUuid;
        this.username = entity.username;

        this.status = entity.status;

        this.trafficLimitBytes = Number(entity.trafficLimitBytes);
        this.trafficLimitStrategy = entity.trafficLimitStrategy;

        this.expireAt = entity.expireAt;

        this.telegramId = entity.telegramId ? Number(entity.telegramId) : null;
        this.email = entity.email;
        this.description = entity.description;
        this.tag = entity.tag;

        this.hwidDeviceLimit = entity.hwidDeviceLimit;
        this.externalSquadUuid = entity.externalSquadUuid;

        this.trojanPassword = entity.trojanPassword;
        this.vlessUuid = entity.vlessUuid;
        this.ssPassword = entity.ssPassword;

        this.lastTriggeredThreshold = entity.lastTriggeredThreshold;
        this.subRevokedAt = entity.subRevokedAt;
        this.subLastUserAgent = entity.subLastUserAgent;
        this.subLastOpenedAt = entity.subLastOpenedAt;
        this.lastTrafficResetAt = entity.lastTrafficResetAt;

        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;

        this.subscriptionUrl = `https://${subPublicDomain}/${entity.shortUuid}`;
        this.activeInternalSquads = entity.activeInternalSquads;

        this.userTraffic = {
            usedTrafficBytes: Number(entity.userTraffic.usedTrafficBytes),
            lifetimeUsedTrafficBytes: Number(entity.userTraffic.lifetimeUsedTrafficBytes),
            onlineAt: entity.userTraffic.onlineAt,
            lastConnectedNodeUuid: entity.userTraffic.lastConnectedNodeUuid,
            firstConnectedAt: entity.userTraffic.firstConnectedAt,
        };

        this.subscriptionUrl = `https://${subPublicDomain}/${entity.shortUuid}`;
    }
}
