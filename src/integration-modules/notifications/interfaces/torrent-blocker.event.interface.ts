import { TTorrentBlockerEvents } from '@libs/contracts/constants';

import { ITorrentBlockerReport } from '@modules/node-plugins/interfaces';
import { NodesEntity } from '@modules/nodes/entities/nodes.entity';
import { UserEntity } from '@modules/users/entities';

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
