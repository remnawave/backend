export interface ITorrentBlockerReportsStats {
    distinctNodes: number;
    distinctUsers: number;
    totalReports: number;
    reportsLast24Hours: number;
}

export class TorrentBlockerReportsStatsResponseModel {
    public readonly stats: ITorrentBlockerReportsStats;

    constructor(data: { stats: ITorrentBlockerReportsStats }) {
        this.stats = data.stats;
    }
}
