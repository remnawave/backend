import { TUsersStatus } from '@libs/contracts/constants';
import { IGet7DaysStats } from '@modules/nodes-usage-history/interfaces';

interface IGetStatsResponseData {
    cpu: {
        cores: number;
        physicalCores: number;
    };
    memory: {
        total: number;
        free: number;
        used: number;
        active: number;
        available: number;
    };
    uptime: number;
    timestamp: number;
    users: {
        onlineLastMinute: number;
        statusCounts: Record<TUsersStatus, number>;
        totalUsers: number;
        totalTrafficBytes: bigint;
    };
    stats: {
        nodesUsageLastTwoDays: {
            current: string;
            previous: string;
            percentage: number;
        };
        sevenDaysStats: IGet7DaysStats[];
    };
}

export class GetStatsResponseModel {
    cpu: {
        cores: number;
        physicalCores: number;
    };
    memory: {
        total: number;
        free: number;
        used: number;
        active: number;
        available: number;
    };
    uptime: number;
    timestamp: number;
    users: {
        onlineLastMinute: number;
        statusCounts: Record<TUsersStatus, number>;
        totalUsers: number;
        totalTrafficBytes: string;
    };
    stats: {
        nodesUsageLastTwoDays: {
            current: string;
            previous: string;
            percentage: number;
        };
        sevenDaysStats: IGet7DaysStats[];
    };

    constructor(data: IGetStatsResponseData) {
        this.cpu = data.cpu;
        this.memory = data.memory;
        this.uptime = data.uptime;
        this.timestamp = data.timestamp;
        this.users = {
            ...data.users,
            totalTrafficBytes: data.users.totalTrafficBytes.toString(),
        };
        this.stats = data.stats;
    }
}
