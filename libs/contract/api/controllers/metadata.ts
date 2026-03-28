export const METADATA_CONTROLLER = 'metadata' as const;

export const METADATA_ROUTES = {
    NODE: {
        GET: (uuid: string) => `node/${uuid}`,
        UPSERT: (uuid: string) => `node/${uuid}`,
    },
    USER: {
        GET: (uuid: string) => `user/${uuid}`,
        UPSERT: (uuid: string) => `user/${uuid}`,
    },
} as const;
