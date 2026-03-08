import { TorrentBlockerReports } from '@prisma/client';

export class BaseTorrentBlockerReportEntity implements TorrentBlockerReports {
    public id: bigint;
    public userId: bigint;
    public nodeId: bigint;
    public report: Record<string, unknown>;

    public createdAt: Date;
    public updatedAt: Date;
    constructor(report: Partial<TorrentBlockerReports>) {
        Object.assign(this, report);
        return this;
    }
}
