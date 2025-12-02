export const SUBSCRIPTION_TEMPLATE_CONTROLLER = 'subscription-templates' as const;

const ACTIONS_ROUTE = 'actions' as const;

export const SUBSCRIPTION_TEMPLATE_ROUTES = {
    GET_ALL: '', // get
    GET: (uuid: string) => `${uuid}`, // get
    UPDATE: '', // patch
    DELETE: (uuid: string) => `${uuid}`, // delete
    CREATE: '', // post

    ACTIONS: {
        REORDER: `${ACTIONS_ROUTE}/reorder`,
    },
} as const;
