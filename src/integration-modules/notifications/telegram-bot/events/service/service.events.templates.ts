import { EVENTS, TServiceEvents, TErrorsEvents } from '@libs/contracts/constants';

import { ServiceEvent, CustomErrorEvent } from '@integration-modules/notifications/interfaces';

import { IInlineKeyboard } from '@queue/notifications/telegram-bot-logger/interfaces/inline-keyboard.interface';

export type ServiceEventsTemplate = (event: ServiceEvent) => {
    message: string;
    keyboard?: IInlineKeyboard[];
} | null;
export type ErrorsEventsTemplate = (event: CustomErrorEvent) => string | null;

const separator = '➖➖➖➖➖➖➖➖➖';

export const SERVICE_EVENTS_TEMPLATES: Record<TServiceEvents, ServiceEventsTemplate> = {
    [EVENTS.SERVICE.PANEL_STARTED]: (e) => ({
        message: `
<tg-emoji emoji-id='5418304400152096012'>🌊</tg-emoji> <b>#panel_started</b>
${separator}
<tg-emoji emoji-id='5461117441612462242'>✅</tg-emoji> Remnawave v${e.data.panelVersion} is up and running.

<tg-emoji emoji-id='5463036196777128277'>🦋</tg-emoji> Join community: @remnawave
<tg-emoji emoji-id='5415680458602081205'>📚</tg-emoji> Documentation: https://docs.rw`,
        keyboard: [
            {
                url: 'https://github.com/remnawave/panel',
                text: 'Leave a star',
                customEmoji: '5258039825805624495',
            },
            {
                url: 'https://docs.rw/docs/donate/',
                text: 'Support Remnawave',
                customEmoji: '5404408875279458778',
                style: 'primary',
            },
        ],
    }),
    [EVENTS.SERVICE.LOGIN_ATTEMPT_FAILED]: (e) => ({
        message: `
<tg-emoji emoji-id='5330115548900501467'>🔑</tg-emoji> <tg-emoji emoji-id='5472267631979405211'>❌</tg-emoji><b>#login_attempt_failed</b>
${separator}
<tg-emoji emoji-id='5256143829672672750'>👥</tg-emoji> <code>${e.data.loginAttempt?.username}</code>
<tg-emoji emoji-id='5330115548900501467'>🔑</tg-emoji> <b>Password:</b> <code>${e.data.loginAttempt?.password}</code>
<tg-emoji emoji-id='5447410659077661506'>🌐</tg-emoji> <b>IP:</b> <code>${e.data.loginAttempt?.ip}</code>
<tg-emoji emoji-id='5460756166143405924'>💻</tg-emoji> <b>User agent:</b> <code>${e.data.loginAttempt?.userAgent}</code>
<tg-emoji emoji-id='5443038326535759644'>💬</tg-emoji> <b>Description:</b> <code>${e.data.loginAttempt?.description}</code>`,
    }),
    [EVENTS.SERVICE.LOGIN_ATTEMPT_SUCCESS]: (e) => ({
        message: `
<tg-emoji emoji-id='5330115548900501467'>🔑</tg-emoji> <tg-emoji emoji-id='5461117441612462242'>✅</tg-emoji> <b>#login_attempt_success</b>
${separator}
<tg-emoji emoji-id='5256143829672672750'>👥</tg-emoji> <code>${e.data.loginAttempt?.username}</code>
<tg-emoji emoji-id='5447410659077661506'>🌐</tg-emoji> <b>IP:</b> <code>${e.data.loginAttempt?.ip}</code>
<tg-emoji emoji-id='5460756166143405924'>💻</tg-emoji> <b>User agent:</b> <code>${e.data.loginAttempt?.userAgent}</code>
<tg-emoji emoji-id='5443038326535759644'>💬</tg-emoji> <b>Description:</b> <code>${e.data.loginAttempt?.description}</code>`,
    }),
    [EVENTS.SERVICE.SUBPAGE_CONFIG_CHANGED]: (e) => ({
        message: `
<tg-emoji emoji-id='5334882760735598374'>📝</tg-emoji> <b>#subpage_config_changed</b>
${separator}
<b>Action:</b> <code>${e.data.subpageConfig!.action}</code>
<b>UUID:</b> <code>${e.data.subpageConfig!.uuid}</code>`,
    }),
};

export const ERRORS_EVENTS_TEMPLATES: Record<TErrorsEvents, ErrorsEventsTemplate> = {
    [EVENTS.ERRORS.BANDWIDTH_USAGE_THRESHOLD_REACHED_MAX_NOTIFICATIONS]: (e) => `
<tg-emoji emoji-id='5276089339967716971'>📢</tg-emoji> <b>#bandwidth_usage_threshold_reached_max_notifications</b>
${separator}
<b>Description:</b> <code>${e.data.description}</code>`,
};
