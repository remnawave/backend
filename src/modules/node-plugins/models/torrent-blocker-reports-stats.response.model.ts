import { colorFromUuid } from '@kastov/uuid-color';

import {
    IGetTopTorrentBlockerNode,
    IGetTopTorrentBlockerNodeConverted,
    IGetTopTorrentBlockerUser,
    IGetTopTorrentBlockerUserConverted,
} from '../interfaces/tb-stats.interface';

export interface ITorrentBlockerReportsStats {
    distinctNodes: number;
    distinctUsers: number;
    totalReports: number;
    reportsLast24Hours: number;
}

export class TorrentBlockerReportsStatsResponseModel {
    public readonly stats: ITorrentBlockerReportsStats;
    public readonly topUsers: IGetTopTorrentBlockerUserConverted[];
    public readonly topNodes: IGetTopTorrentBlockerNodeConverted[];

    constructor(data: {
        stats: ITorrentBlockerReportsStats;
        topUsers: IGetTopTorrentBlockerUser[];
        topNodes: IGetTopTorrentBlockerNode[];
    }) {
        this.stats = data.stats;
        this.topUsers = data.topUsers.map((item) => ({
            uuid: item.uuid,
            color: colorFromUuid(item.uuid),
            username: item.username,
            total: Number(item.total),
        }));
        this.topNodes = data.topNodes.map((item) => ({
            uuid: item.uuid,
            color: colorFromUuid(item.uuid),
            name: item.name,
            countryCode: item.countryCode,
            total: Number(item.total),
        }));
    }
}
