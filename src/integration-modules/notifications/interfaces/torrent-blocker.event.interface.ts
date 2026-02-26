import { TTorrentBlockerEvents } from '@libs/contracts/constants';

import { NodesEntity } from '@modules/nodes/entities/nodes.entity';
import { UserEntity } from '@modules/users/entities';

export interface ITorrentBlockerReport {
    actionReport: {
        blocked: boolean;
        ip: string;
        blockDuration: number;
        willUnblockAt: Date;
        userId: string;
        processedAt: Date;
    };
    xrayReport: {
        email: string | null;
        level: number | null;
        protocol: string | null;
        network: string;
        source: string | null;
        destination: string;
        routeTarget: string | null;
        originalTarget: string | null;
        inboundTag: string | null;
        inboundName: string | null;
        inboundLocal: string | null;
        outboundTag: string | null;
        ts: number;
    };
}

export class TorrentBlockerEvent {
    data: {
        node: NodesEntity;
        user: UserEntity;
        report: ITorrentBlockerReport;
    };
    eventName: TTorrentBlockerEvents;
    constructor(
        data: {
            node: NodesEntity;
            user: UserEntity;
            report: ITorrentBlockerReport;
        },
        eventName: TTorrentBlockerEvents,
    ) {
        this.data = data;
        this.eventName = eventName;
    }
}
