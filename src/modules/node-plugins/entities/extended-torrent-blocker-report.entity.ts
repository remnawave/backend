import { TorrentBlockerReports } from '@prisma/client';

import { BaseTorrentBlockerReportEntity } from './base-torrent-blocker-report.entity';

interface INode {
    uuid: string;
    name: string;
    countryCode: string;
}

interface IUser {
    uuid: string;
    username: string;
}

export class ExtendedTorrentBlockerReportEntity extends BaseTorrentBlockerReportEntity {
    public user: IUser;
    public node: INode;

    constructor(report: Partial<TorrentBlockerReports>, user: IUser, node: INode) {
        super(report);
        this.user = user;
        this.node = node;
        return this;
    }
}
