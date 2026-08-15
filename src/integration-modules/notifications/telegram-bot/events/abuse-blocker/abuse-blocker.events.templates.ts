import { EVENTS, TAbuseBlockerEvents } from '@libs/contracts/constants';

import { AbuseBlockerEvent } from '@integration-modules/notifications/interfaces';

import { PANEL_URLS } from '@queue/notifications/telegram-bot-logger/enums';
import { IInlineKeyboard } from '@queue/notifications/telegram-bot-logger/interfaces/inline-keyboard.interface';

export type AbuseBlockerEventsTemplate = (
    event: AbuseBlockerEvent,
    panelDomain: string | undefined,
) => { message: string; keyboard?: IInlineKeyboard[] };

export const ABUSE_BLOCKER_EVENTS_TEMPLATES: Record<
    TAbuseBlockerEvents,
    AbuseBlockerEventsTemplate
> = {
    [EVENTS.ABUSE_BLOCKER.REPORT]: (event, panelDomain) => {
        const { report, backendAction, strikeLevel } = event.data;
        const rules = report.detections.map((item) => item.rule).join(', ');
        const lines = [
            `🚨 #abuseBlocker #${event.data.user.username}`,
            `🖥 <code>${event.data.node.name}</code> (<code>${event.data.node.address}</code>)`,
            `🤖 <code>${event.data.user.username}</code> (<code>${event.data.user.id}</code>)`,
            '',
            '<blockquote expandable>',
            `<b>Severity:</b> <code>${report.severity}</code>`,
            `<b>Score:</b> <code>${report.score.before} + ${report.score.delta} = ${report.score.after}</code>`,
            `<b>Rules:</b> <code>${rules}</code>`,
            `<b>Source:</b> <code>${report.sourceIp}</code>`,
            `<b>Destination:</b> <code>${report.destinationIp}:${report.destinationPort}</code>`,
            `<b>Backend action:</b> <code>${backendAction}</code>`,
            `<b>Strike:</b> <code>${strikeLevel}</code>`,
            '</blockquote>',
        ];
        return {
            message: lines.join('\n'),
            keyboard: buildUserKeyboard(event.data.user.id.toString(), panelDomain),
        };
    },
};

const buildUserKeyboard = (
    userId: string,
    panelDomain: string | undefined,
): IInlineKeyboard[] | undefined =>
    panelDomain
        ? [
              {
                  url: PANEL_URLS.USER(panelDomain, userId),
                  text: 'View user',
                  customEmoji: '5282843764451195532',
                  style: 'primary' as const,
              },
          ]
        : undefined;
