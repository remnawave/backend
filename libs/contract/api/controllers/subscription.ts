export const SUBSCRIPTION_CONTROLLER = 'sub' as const;

export const SUBSCRIPTION_ROUTES = {
    GET: '',
    GET_OUTLINE: '/outline',
    GET_INFO: (shortUuid: string) => `${shortUuid}/info`,
} as const;
