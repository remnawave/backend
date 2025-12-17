import { IGetLegacyStatsUserUsage } from '../interfaces';

export class GetLegacyStatsUserUsageResponseModel {
    public readonly userUuid: string;
    public readonly nodeUuid: string;
    public readonly nodeName: string;
    public readonly countryCode: string;
    public readonly total: number;
    public readonly date: Date;

    constructor(data: IGetLegacyStatsUserUsage) {
        this.userUuid = data.userUuid;
        this.nodeUuid = data.nodeUuid;
        this.nodeName = data.nodeName;
        this.countryCode = data.countryCode;
        this.total = Number(data.total);
        this.date = new Date(data.date);
    }
}
