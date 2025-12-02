import { Users } from '@prisma/client';

import { TResetPeriods, TUsersStatus } from '@contract/constants';

export class BaseUserEntity implements Users {
    public tId: bigint;
    public uuid: string;
    public shortUuid: string;
    public username: string;
    public status: TUsersStatus;

    public trafficLimitBytes: bigint;
    public trafficLimitStrategy: TResetPeriods;
    public subLastUserAgent: string | null;
    public subLastOpenedAt: Date | null;

    public expireAt: Date;
    public subRevokedAt: Date | null;
    public lastTrafficResetAt: Date | null;
    public lastTriggeredThreshold: number;

    public trojanPassword: string;
    public vlessUuid: string;
    public ssPassword: string;

    public description: null | string;
    public tag: string | null;
    public telegramId: bigint | null;
    public email: string | null;

    public hwidDeviceLimit: number | null;

    public externalSquadUuid: string | null;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(user: Partial<Users>) {
        Object.assign(this, user);
    }
}
