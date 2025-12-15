export const SUBSCRIPTIONS_CONTROLLER = 'subscriptions' as const;

export const SUBSCRIPTIONS_ROUTES = {
    GET: '',
    GET_BY: {
        USERNAME: (username: string) => `by-username/${username}`,
        UUID: (uuid: string) => `by-uuid/${uuid}`,
        SHORT_UUID: (shortUuid: string) => `by-short-uuid/${shortUuid}`,
        SHORT_UUID_RAW: (shortUuid: string) => `by-short-uuid/${shortUuid}/raw`,
    },
    SUBPAGE: {
        GET_CONFIG: (shortUuid: string) => `subppage-config/${shortUuid}`,
    },
} as const;
