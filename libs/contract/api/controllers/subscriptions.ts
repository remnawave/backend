export const SUBSCRIPTIONS_CONTROLLER = 'subscriptions' as const;

export const SUBSCRIPTIONS_ROUTES = {
    GET: '',
    GET_BY: {
        USERNAME: (username: string) => `by-username/${username}`,
    },
} as const;
