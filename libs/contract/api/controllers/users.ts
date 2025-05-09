export const USERS_CONTROLLER = 'users' as const;

export const USERS_ACTIONS_ROUTE = 'actions' as const;

export const USERS_ROUTES = {
    CREATE: '',
    UPDATE: '',
    GET: '',
    DELETE: (uuid: string) => `${uuid}`,
    GET_BY_UUID: (uuid: string) => `${uuid}`,
    ACTIONS: {
        ENABLE: (uuid: string) => `${uuid}/${USERS_ACTIONS_ROUTE}/enable`,
        DISABLE: (uuid: string) => `${uuid}/${USERS_ACTIONS_ROUTE}/disable`,
        RESET_TRAFFIC: (uuid: string) => `${uuid}/${USERS_ACTIONS_ROUTE}/reset-traffic`,
        ACTIVATE_ALL_INBOUNDS: (uuid: string) =>
            `${uuid}/${USERS_ACTIONS_ROUTE}/activate-all-inbounds`,
        REVOKE_SUBSCRIPTION: (uuid: string) => `${uuid}/${USERS_ACTIONS_ROUTE}/revoke`,
    },
    GET_BY: {
        SHORT_UUID: (shortUuid: string) => `by-short-uuid/${shortUuid}`,
        USERNAME: (username: string) => `by-username/${username}`,
        SUBSCRIPTION_UUID: (subscriptionUuid: string) => `by-subscription-uuid/${subscriptionUuid}`,
        TELEGRAM_ID: (telegramId: string) => `by-telegram-id/${telegramId}`,
        EMAIL: (email: string) => `by-email/${email}`,
        TAG: (tag: string) => `by-tag/${tag}`,
    },

    BULK: {
        DELETE_BY_STATUS: 'bulk/delete-by-status',
        UPDATE: 'bulk/update',
        RESET_TRAFFIC: 'bulk/reset-traffic',
        REVOKE_SUBSCRIPTION: 'bulk/revoke-subscription',
        DELETE: 'bulk/delete',
        UPDATE_INBOUNDS: 'bulk/update-inbounds',
        ALL: {
            UPDATE: 'bulk/all/update',
            RESET_TRAFFIC: 'bulk/all/reset-traffic',
        },
    },

    STATS: {
        GET_USAGE_BY_RANGE: (uuid: string) => `stats/usage/${uuid}/range`,
    },

    TAGS: {
        GET: 'tags',
    },
} as const;
