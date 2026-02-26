import dayjs from 'dayjs';

import { EVENTS, TTorrentBlockerEvents } from '@libs/contracts/constants';

import { TorrentBlockerEvent } from '@integration-modules/notifications/interfaces';

export type TorrentBlockerEventsTemplate = (event: TorrentBlockerEvent) => string | null;

const separator = '➖➖➖➖➖➖➖➖➖';

const torrentBlockerHeader = (emoji: string, tag: string, subtitle?: string) => {
    const header = `${emoji} <b>#${tag}</b>`;
    return subtitle ? `${header}\n<b>${subtitle}</b>\n${separator}` : `${header}\n${separator}`;
};

export const TORRENT_BLOCKER_EVENTS_TEMPLATES: Record<
    TTorrentBlockerEvents,
    TorrentBlockerEventsTemplate
> = {
    [EVENTS.TORRENT_BLOCKER.REPORT]: (e) => {
        const { actionReport, xrayReport } = e.data.report;

        const lines = [
            torrentBlockerHeader(
                '<tg-emoji emoji-id="5472267631979405211">⛔</tg-emoji>',
                'torrentBlocked',
                'Torrent activity detected',
            ),
            '',
            '<tg-emoji emoji-id="5258011929993026890">👤</tg-emoji> <b>User</b>',
            `<b>Username:</b> <code>${e.data.user.username}</code>`,
            `<b>Short UUID:</b> <code>${e.data.user.shortUuid}</code>`,
            '',
            '<tg-emoji emoji-id="5271604874419647061">🔗</tg-emoji> <b>Connection</b>',
            `<b>IP:</b> <code>${actionReport.ip}</code>`,
            `<b>Protocol:</b> <code>${xrayReport.protocol ?? 'unknown'}</code>`,
            `<b>Network:</b> <code>${xrayReport.network}</code>`,
            `<b>Destination:</b> <code>${xrayReport.destination}</code>`,
            `<b>Inbound:</b> <code>${xrayReport.inboundTag ?? '—'}</code>`,
            '',
            '<tg-emoji emoji-id="5472267631979405211">⛔</tg-emoji> <b>Block info</b>',
            `<b>Duration:</b> <code>${Math.floor(actionReport.blockDuration / 60)} min</code>`,
            `<b>Unblock at:</b> <code>${dayjs(actionReport.willUnblockAt).format('DD.MM.YYYY HH:mm:ss')}</code>`,
            '',
            `<tg-emoji emoji-id="5282843764451195532">🖥</tg-emoji> <b>Node:</b> <code>${e.data.node.name}</code>`,
        ];

        return lines.join('\n');
    },
};
