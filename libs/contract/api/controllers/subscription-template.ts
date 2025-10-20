export const SUBSCRIPTION_TEMPLATE_CONTROLLER = 'subscription-templates' as const;

export const SUBSCRIPTION_TEMPLATE_ROUTES = {
    GET_ALL: '', // get
    GET: (uuid: string) => `${uuid}`, // get
    UPDATE: '', // patch
    DELETE: (uuid: string) => `${uuid}`, // delete
    CREATE: '', // post
} as const;
