import { TUsersStatus } from '@libs/contracts/constants';

interface IGetStatsResponseData {
    cpu: {
        cores: number;
        physicalCores: number;
    };
    memory: {
        active: number;
        available: number;
        free: number;
        total: number;
        used: number;
    };
    onlineStats: {
        lastDay: number;
        lastWeek: number;
        neverOnline: number;
        onlineNow: number;
    };
    timestamp: number;
    uptime: number;
    users: {
        statusCounts: Record<TUsersStatus, number>;
        totalUsers: number;
    };
    nodes: {
        totalOnline: number;
        totalBytesLifetime: string;
    };
}

export class GetStatsResponseModel {
    cpu: {
        cores: number;
        physicalCores: number;
    };
    memory: {
        active: number;
        available: number;
        free: number;
        total: number;
        used: number;
    };
    uptime: number;
    timestamp: number;
    users: {
        statusCounts: Record<TUsersStatus, number>;
        totalUsers: number;
    };
    onlineStats: {
        lastDay: number;
        lastWeek: number;
        neverOnline: number;
        onlineNow: number;
    };
    nodes: {
        totalOnline: number;
        totalBytesLifetime: string;
    };

    constructor(data: IGetStatsResponseData) {
        this.cpu = data.cpu;
        this.memory = data.memory;
        this.uptime = data.uptime;
        this.timestamp = data.timestamp;
        this.users = data.users;
        this.onlineStats = data.onlineStats;
        this.nodes = data.nodes;
    }
}
