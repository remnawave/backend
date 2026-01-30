import { EVENTS, TServiceEvents, TErrorsEvents } from '@libs/contracts/constants';

import { ServiceEvent, CustomErrorEvent } from '@integration-modules/notifications/interfaces';

export type ServiceEventsTemplate = (event: ServiceEvent) => string | null;
export type ErrorsEventsTemplate = (event: CustomErrorEvent) => string | null;

const separator = '➖➖➖➖➖➖➖➖➖';

export const SERVICE_EVENTS_TEMPLATES: Record<TServiceEvents, ServiceEventsTemplate> = {
    [EVENTS.SERVICE.PANEL_STARTED]: (e) => `
🌊 <b>#panel_started</b>
${separator}
✅ Remnawave v${e.data.panelVersion} is up and running.

🦋 Join community: @remnawave
📚 Documentation: https://docs.rw

⭐ <a href="https://github.com/remnawave/panel">Leave a star on GitHub</a>`,

    [EVENTS.SERVICE.LOGIN_ATTEMPT_FAILED]: (e) => `
🔑 ❌ <b>#login_attempt_failed</b>
${separator}
<b>👥</b> <code>${e.data.loginAttempt?.username}</code>
<b>🔑 Password:</b> <code>${e.data.loginAttempt?.password}</code>
<b>🌐 IP:</b> <code>${e.data.loginAttempt?.ip}</code>
<b>💻 User agent:</b> <code>${e.data.loginAttempt?.userAgent}</code>
<b>💬 Description:</b> <code>${e.data.loginAttempt?.description}</code>`,

    [EVENTS.SERVICE.LOGIN_ATTEMPT_SUCCESS]: (e) => `
🔑 ✅ <b>#login_attempt_success</b>
${separator}
<b>👥</b> <code>${e.data.loginAttempt?.username}</code>
<b>🌐 IP:</b> <code>${e.data.loginAttempt?.ip}</code>
<b>💻 User agent:</b> <code>${e.data.loginAttempt?.userAgent}</code>
<b>💬 Description:</b> <code>${e.data.loginAttempt?.description}</code>`,

    [EVENTS.SERVICE.SUBPAGE_CONFIG_CHANGED]: (e) => `
📝  <b>#subpage_config_changed</b>
${separator}
<b>Action:</b> <code>${e.data.subpageConfig!.action}</code>
<b>UUID:</b> <code>${e.data.subpageConfig!.uuid}</code>`,
};

export const ERRORS_EVENTS_TEMPLATES: Record<TErrorsEvents, ErrorsEventsTemplate> = {
    [EVENTS.ERRORS.BANDWIDTH_USAGE_THRESHOLD_REACHED_MAX_NOTIFICATIONS]: (e) => `
📢 <b>#bandwidth_usage_threshold_reached_max_notifications</b>
${separator}
<b>Description:</b> <code>${e.data.description}</code>`,
};
