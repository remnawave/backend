export const BANDWIDTH_STATS_CONTROLLER = 'bandwidth-stats' as const;

export const BANDWIDTH_STATS_NODES_ROUTE = 'nodes' as const;
export const BANDWIDTH_STATS_USERS_ROUTE = 'users' as const;
export const BANDWIDTH_STATS_INTERNAL_SQUADS_ROUTE = 'internal-squads' as const;
export const BANDWIDTH_STATS_INBOUNDS_ROUTE = 'inbounds' as const;

export const BANDWIDTH_STATS_NODES_CONTROLLER =
    `${BANDWIDTH_STATS_CONTROLLER}/${BANDWIDTH_STATS_NODES_ROUTE}` as const;
export const BANDWIDTH_STATS_USERS_CONTROLLER =
    `${BANDWIDTH_STATS_CONTROLLER}/${BANDWIDTH_STATS_USERS_ROUTE}` as const;
export const BANDWIDTH_STATS_INTERNAL_SQUADS_CONTROLLER =
    `${BANDWIDTH_STATS_CONTROLLER}/${BANDWIDTH_STATS_INTERNAL_SQUADS_ROUTE}` as const;
export const BANDWIDTH_STATS_INBOUNDS_CONTROLLER =
    `${BANDWIDTH_STATS_CONTROLLER}/${BANDWIDTH_STATS_INBOUNDS_ROUTE}` as const;

export const BANDWIDTH_STATS_ROUTES = {
    NODES: {
        GET: '',
        GET_REALTIME: 'realtime',
        GET_USERS: (uuid: string) => `${uuid}/users`,
        GET_USERS_BY_NODES: 'users',
        GET_USAGE: 'usage',
    },
    USERS: {
        GET_BY_ID: (userId: string) => `${userId}`,
    },
    INTERNAL_SQUADS: {
        GET_USAGE: (uuid: string) => `${uuid}/usage`,
        USER_USAGE: (squadUuid: string, userId: string) => `${squadUuid}/users/${userId}/usage`,
    },
    INBOUNDS: {
        GET_USAGE: (uuid: string) => `${uuid}/usage`,
        USER_USAGE: (uuid: string, userId: string) => `${uuid}/users/${userId}/usage`,
        GET_TOP_USERS: (uuid: string) => `${uuid}/top-users`,
    },
} as const;
