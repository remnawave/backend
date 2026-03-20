import { TorrentBlockerEvents } from './torrent-blocker/torrent-blocker.events';
import { ServiceEvents } from './service/service.events';
import { UsersEvents } from './users/users.events';
import { CrmEvents } from './crm/crm.events';
import { NodesEvents } from './nodes';

export const TELEGRAM_BOT_EVENTS = [
    UsersEvents,
    NodesEvents,
    ServiceEvents,
    CrmEvents,
    TorrentBlockerEvents,
];
