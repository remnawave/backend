import dayjs from 'dayjs';

import { prettyBytesUtil } from '@common/utils/bytes';
import { EVENTS, TUserEvents } from '@libs/contracts/constants';

import { UserEvent } from '@integration-modules/notifications/interfaces';

export type UsersEventsTemplate = (event: UserEvent) => string | null;

const separator = '➖➖➖➖➖➖➖➖➖';

const userHeader = (emoji: string, tag: string) => `${emoji} <b>#${tag}</b>\n${separator}`;

const userBasicInfo = (e: UserEvent) => `<b>Username:</b> <code>${e.user.username}</code>`;

const userFullInfo = (e: UserEvent) => `${userBasicInfo(e)}
<b>Traffic limit:</b> <code>${prettyBytesUtil(e.user.trafficLimitBytes)}</code>
<b>Valid until:</b> <code>${dayjs(e.user.expireAt).format('DD.MM.YYYY HH:mm')} UTC</code>
<b>Sub:</b> <code>${e.user.shortUuid}</code>`;

const includeInternalSquadsInfo = (e: UserEvent) => {
    if (e.user.activeInternalSquads.length > 0) {
        return `<b>Internal squads:</b> <code>${e.user.activeInternalSquads.map((squad) => squad.name).join(', ')}</code>`;
    }
    return '<b>Internal squads:</b> <code>-</code>';
};

export const USERS_EVENTS_TEMPLATES: Record<TUserEvents, UsersEventsTemplate> = {
    [EVENTS.USER.CREATED]: (e) => `
${userHeader('🆕', 'created')}
${userFullInfo(e)}
${includeInternalSquadsInfo(e)}`,

    [EVENTS.USER.MODIFIED]: (e) => `
${userHeader('📝', 'modified')}
${userFullInfo(e)}
${includeInternalSquadsInfo(e)}`,

    [EVENTS.USER.REVOKED]: (e) => `
${userHeader('🔄', 'revoked')}
${userFullInfo(e)}
${includeInternalSquadsInfo(e)}`,

    [EVENTS.USER.DELETED]: (e) => `
${userHeader('🗑️', 'deleted')}
${userBasicInfo(e)}`,

    [EVENTS.USER.DISABLED]: (e) => `
${userHeader('❌', 'disabled')}
${userBasicInfo(e)}`,

    [EVENTS.USER.ENABLED]: (e) => `
${userHeader('✅', 'enabled')}
${userBasicInfo(e)}`,

    [EVENTS.USER.LIMITED]: (e) => `
${userHeader('⚠️', 'limited')}
${userBasicInfo(e)}`,

    [EVENTS.USER.EXPIRED]: (e) => `
${userHeader('⏱️', 'expired')}
${userBasicInfo(e)}`,

    [EVENTS.USER.TRAFFIC_RESET]: (e) => `
${userHeader('🔄', 'traffic_reset')}
${userBasicInfo(e)}
<b>Traffic:</b> <code>${prettyBytesUtil(e.user.userTraffic.usedTrafficBytes)}</code>`,

    [EVENTS.USER.FIRST_CONNECTED]: (e) => `
${userHeader('🆕', 'first_connected')}
${userBasicInfo(e)}`,

    [EVENTS.USER.EXPIRE_NOTIFY_EXPIRES_IN_72_HOURS]: (e) => `
${userHeader('⏱️', 'expires_in_72_hours')}
${userBasicInfo(e)}`,

    [EVENTS.USER.EXPIRE_NOTIFY_EXPIRES_IN_48_HOURS]: (e) => `
${userHeader('⏱️', 'expires_in_48_hours')}
${userBasicInfo(e)}`,

    [EVENTS.USER.EXPIRE_NOTIFY_EXPIRES_IN_24_HOURS]: (e) => `
${userHeader('⏱️', 'expires_in_24_hours')}
${userBasicInfo(e)}`,

    [EVENTS.USER.EXPIRE_NOTIFY_EXPIRED_24_HOURS_AGO]: (e) => `
${userHeader('⏱️', 'expired_24_hours_ago')}
${userBasicInfo(e)}`,

    [EVENTS.USER.BANDWIDTH_USAGE_THRESHOLD_REACHED]: (e) => {
        if (e.skipTelegramNotification) return null;
        return `
${userHeader('⚠️', 'bandwidth_usage_threshold_reached')}
${userBasicInfo(e)}
<b>Traffic:</b> <code>${prettyBytesUtil(e.user.userTraffic.usedTrafficBytes)}</code>
<b>Limit:</b> <code>${prettyBytesUtil(e.user.trafficLimitBytes)}</code>
<b>Threshold:</b> <code>${e.user.lastTriggeredThreshold}%</code>`;
    },

    [EVENTS.USER.NOT_CONNECTED]: (e) => {
        if (e.skipTelegramNotification || !e.meta) return null;
        return `
${userHeader('⏱️', `not_connected_after_${e.meta.notConnectedAfterHours}_hours`)}
${userBasicInfo(e)}`;
    },
};
