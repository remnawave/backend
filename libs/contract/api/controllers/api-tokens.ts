export const API_TOKENS_CONTROLLER = 'tokens' as const;

export const API_TOKENS_ROUTES = {
    CREATE: '',
    DELETE: (uuid: string) => `${uuid}`,
    GET: '',
} as const;
