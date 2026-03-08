import { TorrentBlockerReportResponseModel } from './torrent-blocker-report.response.model';

export class GetTorrentBlockerReportsResponseModel {
    public readonly total: number;
    public readonly records: TorrentBlockerReportResponseModel[];

    constructor(data: GetTorrentBlockerReportsResponseModel) {
        this.total = data.total;
        this.records = data.records;
    }
}
