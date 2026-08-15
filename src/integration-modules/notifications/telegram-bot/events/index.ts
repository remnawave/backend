import { CrmEvents } from './crm/crm.events';
import { NodesEvents } from './nodes';
import { ServiceEvents } from './service/service.events';
import { TorrentBlockerEvents } from './torrent-blocker/torrent-blocker.events';
import { UsersEvents } from './users/users.events';

export const TELEGRAM_BOT_EVENTS = [
    AbuseBlockerEvents,
    UsersEvents,
    NodesEvents,
    ServiceEvents,
    CrmEvents,
    TorrentBlockerEvents,
];
import { AbuseBlockerEvents } from './abuse-blocker/abuse-blocker.events';
