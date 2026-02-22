export const BANDWIDTH_STATS_CONTROLLER = 'bandwidth-stats' as const;

export const BANDWIDTH_STATS_NODES_ROUTE = 'nodes' as const;
export const BANDWIDTH_STATS_USERS_ROUTE = 'users' as const;

export const BANDWIDTH_STATS_NODES_CONTROLLER =
    `${BANDWIDTH_STATS_CONTROLLER}/${BANDWIDTH_STATS_NODES_ROUTE}` as const;
export const BANDWIDTH_STATS_USERS_CONTROLLER =
    `${BANDWIDTH_STATS_CONTROLLER}/${BANDWIDTH_STATS_USERS_ROUTE}` as const;

// Variants:
// 1. Nodes -> Metrics
// 2. Nodes -> Management -> Show usage (!need legacy)
// 3. Users -> User -> Show Usage (!need legacy)

export const BANDWIDTH_STATS_ROUTES = {
    NODES: {
        // GET /bandwidth-stats/nodes –– Nodes -> Metrics
        GET: '',
        // GET /bandwidth-stats/nodes/realtime –– Nodes -> Management -> Metric Cards
        GET_REALTIME: 'realtime',
        // GET /bandwidth-stats/nodes/:nodeUuid/users –– Nodes -> Management -> Show usage
        GET_USERS: (uuid: string) => `${uuid}/users`,
    },
    USERS: {
        // GET /bandwidth-stats/users/:userUuid –– Users -> User -> Show Usage
        GET_BY_UUID: (uuid: string) => `${uuid}`,
    },
    LEGACY: {
        NODES: {
            // GET /bandwidth-stats/nodes/:nodeUuid/users/legacy –– Nodes -> Management -> Show usage (legacy)
            GET_USERS: (uuid: string) => `${uuid}/users/legacy`,
        },
        USERS: {
            // GET /bandwidth-stats/users/:userUuid/legacy –– Users -> User -> Show Usage (legacy)
            GET_BY_UUID: (uuid: string) => `${uuid}/legacy`,
        },
    },
} as const;
