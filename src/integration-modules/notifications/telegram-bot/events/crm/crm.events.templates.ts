import dayjs from 'dayjs';

import { EVENTS, TCRMEvents } from '@libs/contracts/constants';

import { CrmEvent } from '@integration-modules/notifications/interfaces';

export type CrmEventsTemplate = (event: CrmEvent) => string | null;

const paymentInfo = (e: CrmEvent) => `
🏢 <b>Provider:</b> <code>${e.data.providerName}</code>
🖥️ <b>Node:</b> <code>${e.data.nodeName}</code>
📆 <b>Due Date:</b> <code>${dayjs(e.data.nextBillingAt).format('DD.MM.YYYY')}</code>
`;

const providerLink = (e: CrmEvent) => `🔗 <a href="${e.data.loginUrl}">Open Provider Panel</a>`;

const getDaysPastDue = (e: CrmEvent) => Math.abs(dayjs().diff(dayjs(e.data.nextBillingAt), 'day'));

export const CRM_EVENTS_TEMPLATES: Record<TCRMEvents, CrmEventsTemplate> = {
    [EVENTS.CRM.INFRA_BILLING_NODE_PAYMENT_IN_7_DAYS]: (e) => `
📅 <b>Payment Reminder</b>

${paymentInfo(e)}

${providerLink(e)}`,

    [EVENTS.CRM.INFRA_BILLING_NODE_PAYMENT_IN_48HRS]: (e) => `
⚠️ <b>Payment Alert - 2 Days Warning</b>

${paymentInfo(e)}

⚡ <i>Payment is due in 2 days!</i>

${providerLink(e)}`,

    [EVENTS.CRM.INFRA_BILLING_NODE_PAYMENT_IN_24HRS]: (e) => `
🚨 <b>URGENT: Payment Due Tomorrow!</b>

${paymentInfo(e)}

🔥 <i>Payment is due tomorrow!</i>

${providerLink(e)}`,

    [EVENTS.CRM.INFRA_BILLING_NODE_PAYMENT_DUE_TODAY]: (e) => `
🔴 <b>CRITICAL: Payment Due TODAY!</b>

${paymentInfo(e)}

⚡ <i>Payment must be completed today!</i>

${providerLink(e)}`,

    [EVENTS.CRM.INFRA_BILLING_NODE_PAYMENT_OVERDUE_24HRS]: (e) => `
❌ <b>OVERDUE: First Notice</b>

${paymentInfo(e)}
⚠️ <b>Days Overdue:</b> <code>${getDaysPastDue(e)} day(s)</code>

🚨 <i>Payment is overdue!</i>

${providerLink(e)}`,

    [EVENTS.CRM.INFRA_BILLING_NODE_PAYMENT_OVERDUE_48HRS]: (e) => `
🔥 <b>OVERDUE: Second Notice</b>

${paymentInfo(e)}
⚠️ <b>Days Overdue:</b> <code>${getDaysPastDue(e)} day(s)</code>

⚡ <i>Critical: Service suspension imminent!</i>

${providerLink(e)}`,

    [EVENTS.CRM.INFRA_BILLING_NODE_PAYMENT_OVERDUE_7_DAYS]: (e) => `
💀 <b>FINAL NOTICE: Service Termination Risk</b>

${paymentInfo(e)}
⚠️ <b>Days Overdue:</b> <code>${getDaysPastDue(e)} day(s)</code>

${providerLink(e)}`,
};
