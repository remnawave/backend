import dayjs from 'dayjs';

import { TResetPeriods } from '@libs/contracts/constants';

import { UserEntity } from '@modules/users/entities';

interface SubscriptionUserInfo {
    download: number;
    expire: number;
    total: number;
    upload: number;
}

export function getSubscriptionUserInfo(user: UserEntity): SubscriptionUserInfo {
    return {
        upload: 0,
        download: Number(user.usedTrafficBytes),
        total: Number(user.trafficLimitBytes),
        // TODO: remove after XTLS Standards published
        expire: user.expireAt.getFullYear() !== 2099 ? dayjs(user.expireAt).unix() : 0,
    };
}

export function getSubscriptionRefillDate(trafficLimitStrategy: TResetPeriods): string | undefined {
    const now = new Date();

    switch (trafficLimitStrategy) {
        case 'DAY':
            now.setDate(now.getDate() + 1);
            now.setHours(0, 0, 0, 0);
            return Math.floor(now.getTime() / 1000).toString();
        case 'WEEK': {
            now.setDate(now.getDate() + (8 - now.getDay()));
            now.setHours(0, 5, 0, 0);
            return Math.floor(now.getTime() / 1000).toString();
        }
        case 'MONTH': {
            now.setDate(1);
            now.setMonth(now.getMonth() + 1);
            now.setHours(0, 10, 0, 0);
            return Math.floor(now.getTime() / 1000).toString();
        }
        case 'NO_RESET':
            return undefined;
    }
}
