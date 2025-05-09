export const NODES_CONTROLLER = 'nodes' as const;

export const NODE_ACTIONS_ROUTE = 'actions' as const;

export const NODES_ROUTES = {
    CREATE: '', // create
    GET: '', // get all nodes
    GET_BY_UUID: (uuid: string) => `${uuid}`, // get by UUID
    UPDATE: '', // update, patch
    DELETE: (uuid: string) => `${uuid}`, // delete by UUID

    ACTIONS: {
        ENABLE: (uuid: string) => `${uuid}/${NODE_ACTIONS_ROUTE}/enable`,
        DISABLE: (uuid: string) => `${uuid}/${NODE_ACTIONS_ROUTE}/disable`,
        RESTART: (uuid: string) => `${uuid}/${NODE_ACTIONS_ROUTE}/restart`,

        RESTART_ALL: `${NODE_ACTIONS_ROUTE}/restart-all`,
        REORDER: `${NODE_ACTIONS_ROUTE}/reorder`,
    },

    STATS: {
        USAGE_BY_RANGE: 'usage/range',
        USAGE_BY_RANGE_USER: (uuid: string) => `usage/${uuid}/users/range`,
        USAGE_REALTIME: 'usage/realtime',
    },
} as const;
