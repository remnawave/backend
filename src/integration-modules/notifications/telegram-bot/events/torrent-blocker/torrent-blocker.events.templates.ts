import dayjs from 'dayjs';

import { EVENTS, TTorrentBlockerEvents } from '@libs/contracts/constants';

import { TorrentBlockerEvent } from '@integration-modules/notifications/interfaces';

import { IInlineKeyboard } from '@queue/notifications/telegram-bot-logger/interfaces/inline-keyboard.interface';
import { PANEL_URLS } from '@queue/notifications/telegram-bot-logger/enums';

export type TorrentBlockerEventsTemplate = (
    event: TorrentBlockerEvent,
    panelDomain: string | undefined,
) => {
    message: string;
    keyboard?: IInlineKeyboard[];
};

export const TORRENT_BLOCKER_EVENTS_TEMPLATES: Record<
    TTorrentBlockerEvents,
    TorrentBlockerEventsTemplate
> = {
    [EVENTS.TORRENT_BLOCKER.REPORT]: (e, panelDomain) => {
        const { actionReport, xrayReport } = e.data.report;

        const lines = [
            `<tg-emoji emoji-id='5469913852462242978'>🧨️</tg-emoji> #torrentBlocked #${e.data.user.username}`,
            `<tg-emoji emoji-id='5215186239853964761'>🖥</tg-emoji> <code>${e.data.node.name}</code> (<code>${e.data.node.address}</code>)`,
            `<tg-emoji emoji-id='5372981976804366741'>🤖</tg-emoji> <code>${e.data.user.username}</code> (<code>${e.data.user.tId}</code>)`,
            '',
            '<blockquote expandable>',
            '<tg-emoji emoji-id="5271604874419647061">🔗</tg-emoji> <b>Connection</b>',
            `<b>IP:</b> <code>${actionReport.ip}</code>`,
            `<b>Protocol:</b> <code>${xrayReport.protocol ?? 'unknown'}</code> (<code>${xrayReport.network}</code>)`,
            `<b>Dest:</b> <code>${xrayReport.destination}</code>`,
            `<b>Inbound:</b> <code>${xrayReport.inboundTag ?? '—'}</code>`,
            '',
            '<tg-emoji emoji-id="5472267631979405211">⛔</tg-emoji> <b>Block info</b>',
            `<b>Duration:</b> <code>${Math.floor(actionReport.blockDuration / 60)} min</code>`,
            `<b>Unblock at:</b> <code>${dayjs(actionReport.willUnblockAt).format('DD.MM.YYYY HH:mm:ss')}</code>`,
            '</blockquote>',
        ];

        return {
            message: lines.join('\n'),
            keyboard: buildUserKeyboard(e.data.user.uuid, panelDomain),
        };
    },
};

function buildUserKeyboard(
    userUuid: string,
    panelDomain: string | undefined,
): IInlineKeyboard[] | undefined {
    if (!panelDomain) return undefined;
    return [
        {
            url: PANEL_URLS.USER(panelDomain, userUuid),
            text: 'View user',
            customEmoji: '5282843764451195532',
            style: 'primary' as const,
        },
    ];
}
