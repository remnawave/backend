import { ExtendedTorrentBlockerReportEntity } from '../entities';
import { ITorrentBlockerReport } from '../interfaces';

export class TorrentBlockerReportResponseModel {
    public id: number;
    public userId: number;
    public nodeId: number;
    public report: ITorrentBlockerReport;
    public createdAt: Date;
    public user: {
        uuid: string;
        username: string;
    };
    public node: {
        uuid: string;
        name: string;
        countryCode: string;
    };

    constructor(entity: ExtendedTorrentBlockerReportEntity) {
        this.id = Number(entity.id);
        this.userId = Number(entity.userId);
        this.nodeId = Number(entity.nodeId);
        this.report = entity.report as unknown as ITorrentBlockerReport;
        this.createdAt = entity.createdAt;
        this.user = entity.user;
        this.node = entity.node;
    }
}
