export const CONNECTIONS_CONTROLLER = 'connections' as const;

export const CONNECTIONS_ROUTES = {
    // POST
    CONNECTIONS_BY_USER: (userId: string) => `by-user/${userId}`,
    // GET
    CONNECTIONS_BY_USER_RESULT: (jobId: string) => `by-user/${jobId}`,

    // POST
    CONNECTIONS_BY_NODE: (uuid: string) => `by-node/${uuid}`,
    // GET
    CONNECTIONS_BY_NODE_RESULT: (jobId: string) => `by-node/${jobId}`,

    // POST
    GEOCHECK_BY_NODE: (uuid: string) => `geocheck/${uuid}`,
    // GET
    GEOCHECK_BY_NODE_RESULT: (jobId: string) => `geocheck/${jobId}`,

    // POST
    DROP_CONNECTIONS: 'drop',
} as const;
