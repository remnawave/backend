export const EVENTS = {
    USER: {
        CREATED: 'user.created',
        MODIFIED: 'user.modified',
        DELETED: 'user.deleted',
        REVOKED: 'user.revoked',
        DISABLED: 'user.disabled',
        ENABLED: 'user.enabled',
        LIMITED: 'user.limited',
        EXPIRED: 'user.expired',
        TRAFFIC_RESET: 'user.traffic_reset',

        EXPIRE_NOTIFY_EXPIRES_IN_72_HOURS: 'user.expires_in_72_hours',
        EXPIRE_NOTIFY_EXPIRES_IN_48_HOURS: 'user.expires_in_48_hours',
        EXPIRE_NOTIFY_EXPIRES_IN_24_HOURS: 'user.expires_in_24_hours',
        EXPIRE_NOTIFY_EXPIRED_24_HOURS_AGO: 'user.expired_24_hours_ago',

        FIRST_CONNECTED: 'user.first_connected',
        BANDWIDTH_USAGE_THRESHOLD_REACHED: 'user.bandwidth_usage_threshold_reached',
        /**
         * Emitted when a user is not connected to the panel for a certain amount of time.
         * Active only when NOT_CONNECTED_USERS_NOTIFICATIONS_ENABLED is true in .env.
         * Note: For performance reasons, user entity's activeInternalSquads and lastConnectedNode fields are always empty.
         * Includes additional meta object with notConnectedAfterHours field.
         */
        NOT_CONNECTED: 'user.not_connected',
    },
    /**
     * HWID events are emitted only when HWID Device Limit feature is enabled.
     * Event payload contains user and HWID device entities.
     * Note: Telegram notifications are skipped for this event.
     * Note: For performance reasons, user entity's activeInternalSquads field is always empty.
     * Returns: user and HWID device entities.
     */
    USER_HWID_DEVICES: {
        ADDED: 'user_hwid_devices.added',
        DELETED: 'user_hwid_devices.deleted',
    },
    NODE: {
        CREATED: 'node.created',
        MODIFIED: 'node.modified',
        DISABLED: 'node.disabled',
        ENABLED: 'node.enabled',
        DELETED: 'node.deleted',
        CONNECTION_LOST: 'node.connection_lost',
        CONNECTION_RESTORED: 'node.connection_restored',
        TRAFFIC_NOTIFY: 'node.traffic_notify',
    },
    SERVICE: {
        PANEL_STARTED: 'service.panel_started',
        LOGIN_ATTEMPT_FAILED: 'service.login_attempt_failed',
        LOGIN_ATTEMPT_SUCCESS: 'service.login_attempt_success',
        SUBPAGE_CONFIG_CHANGED: 'service.subpage_config_changed',
    },
    ERRORS: {
        BANDWIDTH_USAGE_THRESHOLD_REACHED_MAX_NOTIFICATIONS:
            'errors.bandwidth_usage_threshold_reached_max_notifications',
    },
    CRM: {
        INFRA_BILLING_NODE_PAYMENT_IN_7_DAYS: 'crm.infra_billing_node_payment_in_7_days',
        INFRA_BILLING_NODE_PAYMENT_IN_48HRS: 'crm.infra_billing_node_payment_in_48hrs',
        INFRA_BILLING_NODE_PAYMENT_IN_24HRS: 'crm.infra_billing_node_payment_in_24hrs',
        INFRA_BILLING_NODE_PAYMENT_DUE_TODAY: 'crm.infra_billing_node_payment_due_today',

        INFRA_BILLING_NODE_PAYMENT_OVERDUE_24HRS: 'crm.infra_billing_node_payment_overdue_24hrs',
        INFRA_BILLING_NODE_PAYMENT_OVERDUE_48HRS: 'crm.infra_billing_node_payment_overdue_48hrs',
        INFRA_BILLING_NODE_PAYMENT_OVERDUE_7_DAYS: 'crm.infra_billing_node_payment_overdue_7_days',
    },
    CATCH_ALL_USER_EVENTS: 'user.*',
    CATCH_ALL_USER_HWID_DEVICES_EVENTS: 'user_hwid_devices.*',
    CATCH_ALL_NODE_EVENTS: 'node.*',
    CATCH_ALL_SERVICE_EVENTS: 'service.*',
    CATCH_ALL_ERRORS_EVENTS: 'errors.*',
    CATCH_ALL_CRM_EVENTS: 'crm.*',
} as const;

export type TNodeEvents = (typeof EVENTS.NODE)[keyof typeof EVENTS.NODE];
export type TUserEvents = (typeof EVENTS.USER)[keyof typeof EVENTS.USER];
export type TServiceEvents = (typeof EVENTS.SERVICE)[keyof typeof EVENTS.SERVICE];
export type TErrorsEvents = (typeof EVENTS.ERRORS)[keyof typeof EVENTS.ERRORS];
export type TCRMEvents = (typeof EVENTS.CRM)[keyof typeof EVENTS.CRM];
export type TUserHwidDevicesEvents =
    (typeof EVENTS.USER_HWID_DEVICES)[keyof typeof EVENTS.USER_HWID_DEVICES];

export type TAllEvents =
    | TUserEvents
    | TNodeEvents
    | TServiceEvents
    | TErrorsEvents
    | TCRMEvents
    | TUserHwidDevicesEvents;
export type TAllEventChannels = 'telegram' | 'webhook';

export const EVENTS_SCOPES = {
    USER: 'user',
    USER_HWID_DEVICES: 'user_hwid_devices',
    NODE: 'node',
    SERVICE: 'service',
    ERRORS: 'errors',
    CRM: 'crm',
} as const;

export type TEventsScope = (typeof EVENTS_SCOPES)[keyof typeof EVENTS_SCOPES];

type ObjectValues<T> = T[keyof T];
type NonEmptyArray<T> = [T, ...T[]];

export const toZodEnum = <T extends Record<string, string>>(obj: T) =>
    Object.values(obj) as NonEmptyArray<ObjectValues<T>>;
