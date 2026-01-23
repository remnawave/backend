export const NODES_CONTROLLER = 'nodes' as const;

export const NODE_ACTIONS_ROUTE = 'actions' as const;
const BULK_ACTIONS_ROUTE = 'bulk-actions' as const;

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
        RESET_TRAFFIC: (uuid: string) => `${uuid}/${NODE_ACTIONS_ROUTE}/reset-traffic`,

        RESTART_ALL: `${NODE_ACTIONS_ROUTE}/restart-all`,
        REORDER: `${NODE_ACTIONS_ROUTE}/reorder`,
    },
    BULK_ACTIONS: {
        PROFILE_MODIFICATION: `${BULK_ACTIONS_ROUTE}/profile-modification`,
        ACTIONS: `${BULK_ACTIONS_ROUTE}`,
    },

    TAGS: {
        GET: 'tags',
    },
} as const;
