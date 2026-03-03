import dayjs from 'dayjs';

import { prettyBytesUtil } from '@common/utils/bytes';
import { EVENTS, TNodeEvents } from '@libs/contracts/constants';

import { NodeEvent } from '@integration-modules/notifications/interfaces';

export type NodesEventsTemplate = (event: NodeEvent) => string | null;

const separator = '➖➖➖➖➖➖➖➖➖';

const nodeHeader = (emoji: string, tag: string, subtitle?: string) => {
    const header = `${emoji} <b>#${tag}</b>`;
    return subtitle ? `${header}\n<b>${subtitle}</b>\n${separator}` : `${header}\n${separator}`;
};

const nodeBasicInfo = (e: NodeEvent) => `
<b>Name:</b> <code>${e.node.name}</code>
<b>Address:</b> <code>${e.node.address}</code>
`;

export const NODES_EVENTS_TEMPLATES: Record<TNodeEvents, NodesEventsTemplate> = {
    [EVENTS.NODE.CREATED]: (e) => `
${nodeHeader('<tg-emoji emoji-id="5282843764451195532">🖥️</tg-emoji>', 'nodeCreated')}
${nodeBasicInfo(e)}`,

    [EVENTS.NODE.MODIFIED]: (e) => `
${nodeHeader("<tg-emoji emoji-id='5334882760735598374'>📝</tg-emoji>", 'nodeModified')}
${nodeBasicInfo(e)}`,

    [EVENTS.NODE.DISABLED]: (e) => `
${nodeHeader("<tg-emoji emoji-id='5447644880824181073'>⚠️</tg-emoji>", 'nodeDisabled')}
${nodeBasicInfo(e)}`,

    [EVENTS.NODE.ENABLED]: (e) => `
${nodeHeader("<tg-emoji emoji-id='5206607081334906820'>🟩</tg-emoji>", 'nodeEnabled')}
${nodeBasicInfo(e)}`,

    [EVENTS.NODE.DELETED]: (e) => `
${nodeHeader("<tg-emoji emoji-id='5370971163310693562'>💀</tg-emoji>", 'nodeDeleted', 'Node deleted')}
${nodeBasicInfo(e)}`,

    [EVENTS.NODE.CONNECTION_LOST]: (e) => `
${nodeHeader("<tg-emoji emoji-id='5447183459602669338'>🚨</tg-emoji>", 'nodeConnectionLost', 'Connection to node lost')}
<b>Name:</b> <code>${e.node.name}</code>
<b>Reason:</b> <code>${e.node.lastStatusMessage}</code>
<b>Last status change:</b> <code>${dayjs(e.node.lastStatusChange).format('DD.MM.YYYY HH:mm')}</code>
<b>Address:</b> <code>${e.node.address}:${e.node.port}</code>`,

    [EVENTS.NODE.CONNECTION_RESTORED]: (e) => `
${nodeHeader("<tg-emoji emoji-id='5449683594425410231'>❇️</tg-emoji>", 'nodeConnectionRestored', 'Connection to node restored')}
<b>Name:</b> <code>${e.node.name}</code>
<b>Reason:</b> <code>${e.node.lastStatusMessage}</code>
<b>Last status change:</b> <code>${dayjs(e.node.lastStatusChange).format('DD.MM.YYYY HH:mm')}</code>
<b>Address:</b> <code>${e.node.address}:${e.node.port}</code>`,

    [EVENTS.NODE.TRAFFIC_NOTIFY]: (e) => {
        const used = prettyBytesUtil(Number(e.node.trafficUsedBytes), true, 3, true);
        const limit = prettyBytesUtil(Number(e.node.trafficLimitBytes), true, 3, true);
        return `
${nodeHeader("<tg-emoji emoji-id='5431577498364158238'>📊</tg-emoji>", 'nodeTrafficNotify', 'Bandwidth limit reached')}
<tg-emoji emoji-id='5447410659077661506'>🌐</tg-emoji> <code>${used}</code> <b>/</b> <code>${limit}</code>
<b>Name:</b> <code>${e.node.name}</code>
<b>Address:</b> <code>${e.node.address}:${e.node.port}</code>
<b>Traffic reset day:</b> <code>${e.node.trafficResetDay}</code>
<b>Percent:</b> <code>${e.node.notifyPercent} %</code>`;
    },
};
