import { TUsersStatus } from '@libs/contracts/constants';

export interface IUserOnlineStats {
    onlineNow: number;
    lastDay: number;
    lastWeek: number;
    neverOnline: number;
}

export interface IUserStats {
    statusCounts: Record<TUsersStatus, number>;
    totalUsers: number;
}

export interface ShortUserStats {
    onlineStats: IUserOnlineStats;
    statusCounts: IUserStats;
}
