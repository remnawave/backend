import { createHappCryptoLink } from '@common/utils';
import { TResetPeriods, TUsersStatus } from '@libs/contracts/constants';

import { InternalSquadEntity } from '@modules/internal-squads/entities';

import { ILastConnectedNode, UserEntity } from '../entities';

export class GetUserResponseModel {
    public readonly uuid: string;
    public readonly username: string;
    public readonly shortUuid: string;
    public readonly status: TUsersStatus;
    public readonly expireAt: Date;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;
    public readonly subscriptionUuid: string;
    public readonly usedTrafficBytes: number;
    public readonly lifetimeUsedTrafficBytes: number;
    public readonly trafficLimitBytes: number;
    public readonly trafficLimitStrategy: TResetPeriods;
    public readonly subLastUserAgent: null | string;
    public readonly subLastOpenedAt: Date | null;
    public readonly onlineAt: Date | null;
    public readonly lastConnectedNodeUuid: string | null;
    public readonly subRevokedAt: Date | null;
    public readonly lastTrafficResetAt: Date | null;
    public readonly trojanPassword: string;
    public readonly vlessUuid: string;
    public readonly ssPassword: string;
    public readonly description: null | string;
    public readonly tag: null | string;

    public readonly telegramId: number | null;
    public readonly email: string | null;

    public readonly hwidDeviceLimit: number | null;

    public readonly firstConnectedAt: Date | null;
    public readonly lastTriggeredThreshold: number;

    public readonly subscriptionUrl: string;

    public readonly externalSquadUuid: string | null;

    public readonly activeInternalSquads: Omit<InternalSquadEntity, 'createdAt' | 'updatedAt'>[];
    public readonly lastConnectedNode: ILastConnectedNode | null;

    public readonly happ: {
        cryptoLink: string;
    };

    constructor(entity: UserEntity, subPublicDomain: string) {
        this.uuid = entity.uuid;
        this.username = entity.username;
        this.shortUuid = entity.shortUuid;
        this.status = entity.status;
        this.expireAt = entity.expireAt;
        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
        this.usedTrafficBytes = Number(entity.usedTrafficBytes);
        this.lifetimeUsedTrafficBytes = Number(entity.lifetimeUsedTrafficBytes);
        this.trafficLimitBytes = Number(entity.trafficLimitBytes);
        this.trafficLimitStrategy = entity.trafficLimitStrategy;
        this.subLastUserAgent = entity.subLastUserAgent;
        this.subLastOpenedAt = entity.subLastOpenedAt;
        this.onlineAt = entity.onlineAt;
        this.subRevokedAt = entity.subRevokedAt;
        this.lastTrafficResetAt = entity.lastTrafficResetAt;

        this.trojanPassword = entity.trojanPassword;
        this.vlessUuid = entity.vlessUuid;
        this.ssPassword = entity.ssPassword;
        this.description = entity.description;
        this.tag = entity.tag;

        this.telegramId = entity.telegramId ? Number(entity.telegramId) : null;
        this.email = entity.email;

        this.hwidDeviceLimit = entity.hwidDeviceLimit;

        this.firstConnectedAt = entity.firstConnectedAt;
        this.lastTriggeredThreshold = entity.lastTriggeredThreshold;

        this.subscriptionUrl = `https://${subPublicDomain}/${entity.shortUuid}`;

        this.activeInternalSquads = entity.activeInternalSquads;
        this.lastConnectedNode = entity.lastConnectedNode;

        this.externalSquadUuid = entity.externalSquadUuid;

        this.happ = {
            cryptoLink: createHappCryptoLink(this.subscriptionUrl),
        };
    }
}
