export const SUBSCRIPTION_PAGE_CONFIGS_CONTROLLER = 'subscription-page-configs' as const;

const ACTIONS_ROUTE = 'actions' as const;

export const SUBSCRIPTION_PAGE_CONFIGS_ROUTES = {
    GET_ALL: '', // get
    GET: (uuid: string) => `${uuid}`, // get
    UPDATE: '', // patch
    DELETE: (uuid: string) => `${uuid}`, // delete
    CREATE: '', // post

    ACTIONS: {
        REORDER: `${ACTIONS_ROUTE}/reorder`,
    },
} as const;
