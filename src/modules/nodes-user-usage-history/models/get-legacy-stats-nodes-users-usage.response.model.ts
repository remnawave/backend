import { IGetLegacyStatsNodesUsersUsage } from '../interfaces';

export class GetLegacyStatsNodesUsersUsageResponseModel {
    public readonly userUuid: string;
    public readonly nodeUuid: string;

    public readonly username: string;
    public readonly total: number;
    public readonly date: Date;

    constructor(data: IGetLegacyStatsNodesUsersUsage) {
        this.userUuid = data.userUuid;
        this.nodeUuid = data.nodeUuid;
        this.username = data.username;
        this.total = Number(data.total);
        this.date = new Date(data.date);
    }
}
